import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeContext } from '@/components/theme-provider';
import { Spacing, ThemeOptions, type Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function SwatchRow({ palette }: { palette: Palette }) {
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: palette.background }]} />
      <View style={[styles.swatch, { backgroundColor: palette.backgroundElement }]} />
      <View style={[styles.swatch, { backgroundColor: palette.text }]} />
    </View>
  );
}

export function ThemePicker() {
  const { themeId, setThemeId } = useThemeContext();
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {ThemeOptions.map((option) => {
        const selected = option.id === themeId;
        return (
          <Pressable
            key={option.id}
            onPress={() => setThemeId(option.id)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView
              type={selected ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.row}>
              <View style={styles.labelContainer}>
                <ThemedText type="small">{option.label}</ThemedText>
                {option.id === 'system' && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Follow device
                  </ThemedText>
                )}
              </View>
              <View style={styles.preview}>
                <SwatchRow palette={option.light} />
                <SwatchRow palette={option.dark} />
              </View>
              {selected && (
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={16}
                  weight="bold"
                  tintColor={theme.text}
                />
              )}
            </ThemedView>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    padding: Spacing.one,
    gap: Spacing.half,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two + Spacing.one,
  },
  labelContainer: {
    flex: 1,
    gap: Spacing.half,
  },
  preview: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 3,
  },
  swatch: {
    width: Spacing.three,
    height: Spacing.three,
    borderRadius: Spacing.half + Spacing.one,
    borderCurve: 'continuous',
  },
  pressed: {
    opacity: 0.7,
  },
});
