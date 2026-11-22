import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CalculatorProvider } from '@/components/calculator-provider';
import { ThemeProvider as AppThemeProvider, useThemeContext } from '@/components/theme-provider';

SplashScreen.preventAutoHideAsync();

function NavigationTheme() {
  const { mode } = useThemeContext();

  return (
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <CalculatorProvider>
        {/* Headers stay hidden so each screen owns its own chrome. */}
        <Stack screenOptions={{ headerShown: false }} />
      </CalculatorProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <NavigationTheme />
    </AppThemeProvider>
  );
}
