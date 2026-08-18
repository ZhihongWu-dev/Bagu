import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef } from 'react';

import { useProgress } from '@/context/progress-context';

type SoundKind = 'correct' | 'wrong' | 'complete';

type SoundContextValue = {
  playCorrect: () => void;
  playWrong: () => void;
  playComplete: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);
const playerOptions = { downloadFirst: true, keepAudioSessionActive: true } as const;

export function SoundProvider({ children }: PropsWithChildren) {
  const { soundEnabled } = useProgress();
  const correctPlayer = useAudioPlayer(require('../../assets/sounds/correct.wav'), playerOptions);
  const wrongPlayer = useAudioPlayer(require('../../assets/sounds/wrong.wav'), playerOptions);
  const completePlayer = useAudioPlayer(require('../../assets/sounds/complete.wav'), playerOptions);
  const correctStatus = useAudioPlayerStatus(correctPlayer);
  const wrongStatus = useAudioPlayerStatus(wrongPlayer);
  const completeStatus = useAudioPlayerStatus(completePlayer);
  const pending = useRef<SoundKind | null>(null);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch((error: unknown) => {
      if (__DEV__) console.warn('Audio mode setup skipped', error);
    });
  }, []);

  const replay = useCallback((player: typeof correctPlayer) => {
    try {
      void player.seekTo(0)
        .then(() => player.play())
        .catch((error: unknown) => {
          if (__DEV__) console.warn('Sound playback skipped', error);
        });
    } catch (error) {
      if (__DEV__) console.warn('Sound playback skipped', error);
    }
  }, []);

  const play = useCallback((kind: SoundKind) => {
    if (!soundEnabled) return;
    const target = kind === 'correct'
      ? { player: correctPlayer, loaded: correctStatus.isLoaded }
      : kind === 'wrong'
        ? { player: wrongPlayer, loaded: wrongStatus.isLoaded }
        : { player: completePlayer, loaded: completeStatus.isLoaded };
    if (!target.loaded) {
      pending.current = kind;
      return;
    }
    pending.current = null;
    replay(target.player);
  }, [completePlayer, completeStatus.isLoaded, correctPlayer, correctStatus.isLoaded, replay, soundEnabled, wrongPlayer, wrongStatus.isLoaded]);

  useEffect(() => {
    if (!soundEnabled) {
      pending.current = null;
      return;
    }
    if (pending.current === 'correct' && correctStatus.isLoaded) play('correct');
    else if (pending.current === 'wrong' && wrongStatus.isLoaded) play('wrong');
    else if (pending.current === 'complete' && completeStatus.isLoaded) play('complete');
  }, [completeStatus.isLoaded, correctStatus.isLoaded, play, soundEnabled, wrongStatus.isLoaded]);

  return (
    <SoundContext.Provider value={{
      playCorrect: () => play('correct'),
      playWrong: () => play('wrong'),
      playComplete: () => play('complete'),
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSounds() {
  const value = useContext(SoundContext);
  if (!value) throw new Error('useSounds must be used inside SoundProvider');
  return value;
}
