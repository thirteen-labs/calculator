import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemePicker } from '@/components/theme-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCalculator } from '@/hooks/use-calculator';

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { state } = useCalculator();

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={styles.contentContainer}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Settings</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Customize the look and feel of the calculator.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <ThemedView style={styles.themeSection}>
            <ThemedText type="smallBold">Theme</ThemedText>
            <ThemePicker />
          </ThemedView>

          <ThemedView style={styles.themeSection}>
            <ThemedText type="smallBold">About</ThemedText>
            <ThemedView type="backgroundElement" style={styles.aboutCard}>
              <ThemedText type="small">
                A scientific and basic calculator built with Expo and React Native.
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.aboutVersion}>
                Version 1.0.0
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.themeSection}>
            <ThemedText type="smallBold">History</ThemedText>
            <ThemedView type="backgroundElement" style={styles.historyPanel}>
              {state.history.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  No calculations yet
                </ThemedText>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {state.history.length} calculations
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  themeSection: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  aboutCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  aboutVersion: {
    marginTop: Spacing.one,
  },
  historyPanel: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
});
