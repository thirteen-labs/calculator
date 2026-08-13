/**
 * Multi-theming palette registry.
 *
 * Each identity theme (`light`, `dark`, `ocean`, ...) carries a light AND a dark
 * face so the device brightness keeps control under any palette. `'system'` is
 * not a palette — it is the null choice that resolves to the device scheme.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** A single resolved set of colors a screen renders with. */
export type Palette = {
  text: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  functionBg: string;
  functionText: string;
  error: string;
  favorite: string;
};

export type PaletteKey = keyof Palette;

export type ThemeMode = 'light' | 'dark';

/** Selectable theme id. `'system'` follows the device. */
export type ThemeId = 'system' | IdentityThemeId;

/** Palettes that exist as concrete colors (excludes the `'system'` null). */
export type IdentityThemeId = 'light' | 'dark' | 'ocean' | 'forest' | 'midnight';

export type ThemeDefinition = {
  label: string;
  light: Palette;
  dark: Palette;
};

export const Themes = {
  light: {
    label: 'Light',
    light: {
      text: '#000000',
      background: '#ffffff',
      backgroundElement: '#F0F0F3',
      backgroundSelected: '#E0E1E6',
      textSecondary: '#60646C',
      accent: '#3C87F7',
      accentText: '#FFFFFF',
      functionBg: '#A5A5A5',
      functionText: '#000000',
      error: '#FF3B30',
      favorite: '#FFD60A',
    },
    dark: {
      text: '#000000',
      background: '#ffffff',
      backgroundElement: '#F0F0F3',
      backgroundSelected: '#E0E1E6',
      textSecondary: '#60646C',
      accent: '#3C87F7',
      accentText: '#FFFFFF',
      functionBg: '#A5A5A5',
      functionText: '#000000',
      error: '#FF3B30',
      favorite: '#FFD60A',
    },
  },
  dark: {
    label: 'Dark',
    light: {
      text: '#ffffff',
      background: '#000000',
      backgroundElement: '#212225',
      backgroundSelected: '#2E3135',
      textSecondary: '#B0B4BA',
      accent: '#3C87F7',
      accentText: '#FFFFFF',
      functionBg: '#3A3A3C',
      functionText: '#FFFFFF',
      error: '#FF453A',
      favorite: '#FFD60A',
    },
    dark: {
      text: '#ffffff',
      background: '#000000',
      backgroundElement: '#212225',
      backgroundSelected: '#2E3135',
      textSecondary: '#B0B4BA',
      accent: '#3C87F7',
      accentText: '#FFFFFF',
      functionBg: '#3A3A3C',
      functionText: '#FFFFFF',
      error: '#FF453A',
      favorite: '#FFD60A',
    },
  },
  ocean: {
    label: 'Ocean',
    light: {
      text: '#0B1E33',
      background: '#F5F9FF',
      backgroundElement: '#E3EEFB',
      backgroundSelected: '#C9DEF5',
      textSecondary: '#4A6A85',
      accent: '#1A6FBF',
      accentText: '#FFFFFF',
      functionBg: '#B8D4E8',
      functionText: '#0B1E33',
      error: '#D94040',
      favorite: '#E8A820',
    },
    dark: {
      text: '#EAF4FF',
      background: '#0B1524',
      backgroundElement: '#152338',
      backgroundSelected: '#1E3050',
      textSecondary: '#8FA9C4',
      accent: '#4DA3E8',
      accentText: '#0B1524',
      functionBg: '#1E3A55',
      functionText: '#EAF4FF',
      error: '#FF6B6B',
      favorite: '#FFD166',
    },
  },
  forest: {
    label: 'Forest',
    light: {
      text: '#14240F',
      background: '#F6FAF4',
      backgroundElement: '#E4EFE0',
      backgroundSelected: '#CADDC4',
      textSecondary: '#57704F',
      accent: '#3D8B37',
      accentText: '#FFFFFF',
      functionBg: '#C1D6B8',
      functionText: '#14240F',
      error: '#C04040',
      favorite: '#D4A820',
    },
    dark: {
      text: '#F0FAEC',
      background: '#0D1509',
      backgroundElement: '#16240F',
      backgroundSelected: '#22371B',
      textSecondary: '#93A98A',
      accent: '#5CAD56',
      accentText: '#0D1509',
      functionBg: '#1E3318',
      functionText: '#F0FAEC',
      error: '#FF6B6B',
      favorite: '#FFD166',
    },
  },
  midnight: {
    label: 'Midnight',
    light: {
      text: '#1C1730',
      background: '#F7F6FB',
      backgroundElement: '#E8E5F4',
      backgroundSelected: '#D2CDEA',
      textSecondary: '#5C567A',
      accent: '#6B5CE7',
      accentText: '#FFFFFF',
      functionBg: '#D4CEE8',
      functionText: '#1C1730',
      error: '#D94060',
      favorite: '#E8B830',
    },
    dark: {
      text: '#F5F3FF',
      background: '#12101F',
      backgroundElement: '#1D1A30',
      backgroundSelected: '#2A2644',
      textSecondary: '#9B96BC',
      accent: '#8B7BF0',
      accentText: '#12101F',
      functionBg: '#252240',
      functionText: '#F5F3FF',
      error: '#FF7088',
      favorite: '#FFD166',
    },
  },
} as const satisfies Record<IdentityThemeId, ThemeDefinition>;

export const ThemeIds = Object.keys(Themes) as IdentityThemeId[];

export type ThemeOption = {
  id: ThemeId;
  label: string;
  light: Palette;
  dark: Palette;
};

/** Options for the theme picker. `'system'` previews the two base faces. */
export const ThemeOptions: ThemeOption[] = [
  { id: 'system', label: 'Follow device', light: Themes.light.light, dark: Themes.dark.dark },
  ...ThemeIds.map((id) => ({
    id,
    label: Themes[id].label,
    light: Themes[id].light,
    dark: Themes[id].dark,
  })),
];

export const THEME_STORAGE_KEY = 'calculator.theme';

/** Whether a persisted value is a valid theme id. */
export function isThemeId(value: unknown): value is ThemeId {
  return value === 'system' || (typeof value === 'string' && value in Themes);
}

/**
 * Resolves the concrete palette for the active selection.
 * `'system'` follows the device; `'light'`/`'dark'` lock the mode; identity
 * palettes (ocean/forest/midnight) let the device choose their light or dark face.
 */
export function resolveThemeId(
  themeId: ThemeId,
  deviceScheme: 'light' | 'dark' | 'unspecified' | null | undefined,
): IdentityThemeId {
  if (themeId === 'system') {
    return deviceScheme === 'dark' ? 'dark' : 'light';
  }
  return themeId;
}

/** The effective brightness mode for navigation chrome (and face selection). */
export function getThemeMode(
  themeId: ThemeId,
  deviceScheme: 'light' | 'dark' | 'unspecified' | null | undefined,
): ThemeMode {
  if (themeId === 'light') return 'light';
  if (themeId === 'dark') return 'dark';
  return deviceScheme === 'dark' ? 'dark' : 'light';
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
