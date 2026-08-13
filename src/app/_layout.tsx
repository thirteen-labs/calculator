import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ThemeProvider as AppThemeProvider, useThemeContext } from '@/components/theme-provider';

SplashScreen.preventAutoHideAsync();

function NavigationTheme() {
  const { mode } = useThemeContext();

  return (
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <AppThemeProvider>
      <NavigationTheme />
    </AppThemeProvider>
  );
}
