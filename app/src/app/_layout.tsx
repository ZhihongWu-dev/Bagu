import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProgressProvider } from '@/context/progress-context';
import { SoundProvider } from '@/context/sound-context';

export default function RootLayout() {
  return (
    <ProgressProvider>
      <SoundProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </SoundProvider>
    </ProgressProvider>
  );
}
