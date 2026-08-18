import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useProgress } from '@/context/progress-context';

export function RoleNavigationGuard() {
  const { hydrated, targetRole } = useProgress();
  const segments = useSegments();
  const onSelectionScreen = segments[0] === 'select-role';

  useEffect(() => {
    if (!hydrated) return;
    if (!targetRole && !onSelectionScreen) router.replace('/select-role');
    if (targetRole && onSelectionScreen) router.replace('/');
  }, [hydrated, onSelectionScreen, targetRole]);

  return null;
}
