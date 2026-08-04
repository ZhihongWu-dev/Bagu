import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProgressProvider } from '@/context/progress-context';

export default function RootLayout() {
  return (
    <ProgressProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ProgressProvider>
  );
}

