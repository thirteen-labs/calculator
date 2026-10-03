import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCalculator } from '@/hooks/use-calculator';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { HistoryEntry } from '@/calc';

type Filter = 'all' | 'favorites';

/** `toLocaleTimeString` depends on Intl being present, which Hermes may not have. */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function HistoryScreen() {
  const { state, dispatch } = useCalculator();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmingClear, setConfirmingClear] = useState(false);

  const favorites = useMemo(
    () => state.history.filter((entry) => entry.favorite),
    [state.history]
  );
  const entries = filter === 'favorites' ? favorites : state.history;

  const reuse = useCallback(
    (entry: HistoryEntry) => {
      dispatch({ type: 'HISTORY_REUSE', id: entry.id });
      // Send the user back to the keys, where the reused expression now sits.
      router.navigate('/');
    },
    [dispatch]
  );

  const clearHistory = useCallback(() => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    dispatch({ type: 'HISTORY_CLEAR' });
    setConfirmingClear(false);
  }, [confirmingClear, dispatch]);

  const cancelClear = useCallback(() => setConfirmingClear(false), []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<HistoryEntry>) => (
      <HistoryRow
        entry={item}
        theme={theme}
        onReuse={reuse}
        onToggleFavorite={() => dispatch({ type: 'HISTORY_TOGGLE_FAVORITE', id: item.id })}
        onDelete={() => dispatch({ type: 'HISTORY_DELETE', id: item.id })}
      />
    ),
    [dispatch, reuse, theme]
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.id}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.six },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>History</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {state.history.length === 0
                ? 'No calculations yet'
                : `${state.history.length} calculation${state.history.length === 1 ? '' : 's'}` +
                  (favorites.length > 0 ? ` • ${favorites.length} starred` : '')}
            </Text>

            <View style={styles.actions}>
              <FilterButton
                label="All"
                active={filter === 'all'}
                onPress={() => setFilter('all')}
                theme={theme}
              />
              <FilterButton
                label="Starred"
                active={filter === 'favorites'}
                onPress={() => setFilter('favorites')}
                theme={theme}
              />
              {state.history.length > 0 &&
                (confirmingClear ? (
                  <View style={styles.confirmRow}>
                    <Pressable
                      onPress={clearHistory}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.clearButton,
                        { backgroundColor: theme.error, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={[styles.clearLabel, { color: theme.background }]}>Delete all</Text>
                    </Pressable>
                    <Pressable
                      onPress={cancelClear}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Text style={[styles.cancelLabel, { color: theme.textSecondary }]}>Cancel</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={clearHistory}
                    accessibilityRole="button"
                    hitSlop={8}
                    style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Text style={[styles.clearLabel, { color: theme.error }]}>Clear all</Text>
                  </Pressable>
                ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {filter === 'favorites' ? 'No starred calculations' : 'Nothing here yet'}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              {filter === 'favorites'
                ? 'Star a calculation to keep it here.'
                : 'Every result you calculate shows up on this page.'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

function HistoryRow({
  entry,
  theme,
  onReuse,
  onToggleFavorite,
  onDelete,
}: {
  entry: HistoryEntry;
  theme: ReturnType<typeof useTheme>;
  onReuse: (entry: HistoryEntry) => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      {/* The tap target for reuse is a sibling of the row's buttons, not their
          parent, so a tap on the star or the delete button can never also
          reuse the entry. */}
      <Pressable
        onPress={() => onReuse(entry)}
        accessibilityRole="button"
        accessibilityLabel={`Reuse ${entry.expression} = ${entry.result}`}
        style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="head"
          style={[styles.rowExpression, { color: theme.textSecondary }]}
        >
          {entry.expression}
        </Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.rowResult, { color: theme.text }]}>
          {'= ' + entry.result}
        </Text>
        <Text style={[styles.rowTime, { color: theme.textSecondary }]}>{formatTime(entry.timestamp)}</Text>
      </Pressable>
      <Pressable
        onPress={onToggleFavorite}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={entry.favorite ? 'Remove star' : 'Star this calculation'}
        accessibilityState={{ selected: entry.favorite }}
        style={({ pressed }) => [styles.rowAction, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={{ color: entry.favorite ? theme.favorite : theme.textSecondary, fontSize: 20 }}>
          {entry.favorite ? '★' : '☆'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Delete calculation"
        style={({ pressed }) => [styles.rowAction, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={{ color: theme.error, fontSize: 24, fontWeight: '500' }}>×</Text>
      </Pressable>
    </View>
  );
}

function FilterButton({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.filterButton,
        { backgroundColor: active ? theme.accent : theme.backgroundElement, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[styles.filterLabel, { color: active ? theme.accentText : theme.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  filterButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    marginLeft: 'auto',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
  },
  clearLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmRow: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cancelButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingRight: Spacing.two,
  },
  rowMain: {
    flex: 1,
    gap: 2,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  rowExpression: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  rowResult: {
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  rowTime: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  rowAction: {
    padding: Spacing.two,
  },
  empty: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyBody: {
    fontSize: 14,
  },
});
