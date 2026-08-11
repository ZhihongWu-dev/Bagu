import { useSounds } from '@/context/sound-context';

export function useAnswerSounds() {
  const { playCorrect, playWrong } = useSounds();
  return { playCorrect, playWrong };
}

export function useCompletionSound() {
  return useSounds().playComplete;
}
