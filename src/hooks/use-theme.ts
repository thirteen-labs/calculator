import { useColorScheme } from 'react-native';

import { useThemeContext } from '@/components/theme-provider';
import { Themes, getThemeMode, resolveThemeId, type Palette } from '@/constants/theme';

/**
 * Returns the resolved palette for the active theme. Consumers never change:
 * the returned shape is the same flat set of colors the old `Colors[scheme]`
 * lookups produced.
 */
export function useTheme(): Palette {
  const { themeId } = useThemeContext();
  const deviceScheme = useColorScheme();
  const mode = getThemeMode(themeId, deviceScheme);
  return Themes[resolveThemeId(themeId, deviceScheme)][mode];
}
