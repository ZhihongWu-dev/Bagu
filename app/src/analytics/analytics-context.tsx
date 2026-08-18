import Constants from 'expo-constants';
import { usePathname } from 'expo-router';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import type { AnalyticsEventName, AnalyticsProperties } from '@/analytics/protocol';
import { AnalyticsRuntime } from '@/analytics/runtime';
import type { AnalyticsConsent } from '@/analytics/state';

type AnalyticsContextValue = {
  consent: AnalyticsConsent;
  ready: boolean;
  grant: () => Promise<void>;
  deny: () => Promise<void>;
  track: (eventName: AnalyticsEventName, properties?: AnalyticsProperties) => void;
};

const runtime = new AnalyticsRuntime({
  appVersion: Constants.expoConfig?.version ?? 'unknown',
  platform: Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : 'web',
});
const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const [consent, setConsent] = useState<AnalyticsConsent>('unknown');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = runtime.subscribeConsent(setConsent);
    void runtime.initialize().finally(() => setReady(true));
    const timer = setInterval(() => void runtime.flush(), 30_000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') void runtime.flush();
    });
    return () => {
      unsubscribe();
      clearInterval(timer);
      appStateSubscription.remove();
    };
  }, []);

  const value = useMemo<AnalyticsContextValue>(() => ({
    consent,
    ready,
    grant: () => runtime.grant(),
    deny: () => runtime.deny(),
    track: (eventName, properties = {}) => runtime.track(eventName, properties),
  }), [consent, ready]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function AnalyticsScreenTracker() {
  const pathname = usePathname();
  const { track } = useAnalytics();

  useEffect(() => {
    track('screen_viewed', { screen_id: screenId(pathname) });
  }, [pathname, track]);

  return null;
}

export function useAnalytics() {
  const value = useContext(AnalyticsContext);
  if (!value) throw new Error('useAnalytics must be used inside AnalyticsProvider');
  return value;
}

function screenId(pathname: string) {
  if (pathname.startsWith('/lesson/')) return 'lesson';
  if (pathname.startsWith('/complete/')) return 'lesson_complete';
  if (pathname.startsWith('/knowledge/')) return 'knowledge_detail';
  if (pathname === '/library') return 'knowledge_library';
  if (pathname === '/review') return 'review';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/resume') return 'resume_project';
  if (pathname === '/interview') return 'interview';
  return 'learning_path';
}
