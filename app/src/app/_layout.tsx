import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AnalyticsProvider, AnalyticsScreenTracker } from '@/analytics/analytics-context';
import { AnalyticsConsentGate } from '@/components/analytics-consent';
import { RoleNavigationGuard } from '@/components/role-navigation-guard';
import { ProgressProvider } from '@/context/progress-context';
import { SoundProvider } from '@/context/sound-context';

export default function RootLayout() {
  return (
    <AnalyticsProvider>
      <ProgressProvider>
        <SoundProvider>
          <StatusBar style="dark" />
          <AnalyticsScreenTracker />
          <RoleNavigationGuard />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
          <AnalyticsConsentGate />
        </SoundProvider>
      </ProgressProvider>
    </AnalyticsProvider>
  );
}
