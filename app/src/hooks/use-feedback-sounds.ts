import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

import { useProgress } from '@/context/progress-context';

function useReplay(player: ReturnType<typeof useAudioPlayer>) {
  const { soundEnabled } = useProgress();

  return useCallback(() => {
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
  }, [player, soundEnabled]);
}

export function useAnswerSounds() {
  const correctPlayer = useAudioPlayer(require('../../assets/sounds/correct.wav'));
  const wrongPlayer = useAudioPlayer(require('../../assets/sounds/wrong.wav'));
  const playCorrect = useReplay(correctPlayer);
  const playWrong = useReplay(wrongPlayer);
  return { playCorrect, playWrong };
}

export function useCompletionSound() {
  const completePlayer = useAudioPlayer(require('../../assets/sounds/complete.wav'));
  return useReplay(completePlayer);
}
