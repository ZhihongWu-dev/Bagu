import { useAudioPlayer } from 'expo-audio';
import { createContext, PropsWithChildren, useCallback, useContext, useMemo } from 'react';

import { useProgress } from '@/context/progress-context';

type SoundContextValue = {
  playCorrect: () => void;
  playWrong: () => void;
  playComplete: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: PropsWithChildren) {
  const { soundEnabled } = useProgress();
  const correctPlayer = useAudioPlayer(require('../../assets/sounds/correct.wav'));
  const wrongPlayer = useAudioPlayer(require('../../assets/sounds/wrong.wav'));
  const completePlayer = useAudioPlayer(require('../../assets/sounds/complete.wav'));

  const replay = useCallback((player: ReturnType<typeof useAudioPlayer>) => {
    if (!soundEnabled) return;
    try {
      void Promise.resolve(player.seekTo(0))
        .then(() => player.play())
        .catch((error: unknown) => {
          if (__DEV__) console.warn('Sound playback skipped', error);
        });
    } catch (error) {
      if (__DEV__) console.warn('Sound playback skipped', error);
    }
  }, [soundEnabled]);

  const playCorrect = useCallback(() => replay(correctPlayer), [correctPlayer, replay]);
  const playWrong = useCallback(() => replay(wrongPlayer), [replay, wrongPlayer]);
  const playComplete = useCallback(() => replay(completePlayer), [completePlayer, replay]);

  const value = useMemo(() => ({ playCorrect, playWrong, playComplete }), [playComplete, playCorrect, playWrong]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSounds() {
  const value = useContext(SoundContext);
  if (!value) throw new Error('useSounds must be used inside SoundProvider');
  return value;
}
