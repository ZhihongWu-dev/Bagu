import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = join(root, 'assets', 'sounds');
const sampleRate = 44100;

const soundDefinitions = {
  correct: {
    duration: 0.42,
    tones: [
      { start: 0, duration: 0.2, frequency: 523.25, gain: 0.32 },
      { start: 0.13, duration: 0.25, frequency: 659.25, gain: 0.34 },
    ],
  },
  wrong: {
    duration: 0.44,
    tones: [
      { start: 0, duration: 0.22, frequency: 246.94, gain: 0.27 },
      { start: 0.16, duration: 0.24, frequency: 185, gain: 0.29 },
    ],
  },
  complete: {
    duration: 0.82,
    tones: [
      { start: 0, duration: 0.28, frequency: 523.25, gain: 0.24 },
      { start: 0.18, duration: 0.3, frequency: 659.25, gain: 0.25 },
      { start: 0.36, duration: 0.4, frequency: 783.99, gain: 0.27 },
      { start: 0.52, duration: 0.25, frequency: 1046.5, gain: 0.16 },
    ],
  },
};

function envelope(localTime, duration) {
  const attack = Math.min(0.025, duration * 0.18);
  const release = Math.min(0.12, duration * 0.45);
  if (localTime < attack) return localTime / attack;
  if (localTime > duration - release) return Math.max(0, (duration - localTime) / release);
  return 1;
}

function renderSound({ duration, tones }) {
  const sampleCount = Math.ceil(duration * sampleRate);
  const pcm = Buffer.alloc(sampleCount * 2);

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const time = sampleIndex / sampleRate;
    let value = 0;

    for (const tone of tones) {
      const localTime = time - tone.start;
      if (localTime < 0 || localTime > tone.duration) continue;
      const shape = envelope(localTime, tone.duration);
      const fundamental = Math.sin(2 * Math.PI * tone.frequency * localTime);
      const harmonic = Math.sin(2 * Math.PI * tone.frequency * 2 * localTime) * 0.12;
      value += (fundamental + harmonic) * tone.gain * shape;
    }

    const integerValue = Math.round(Math.max(-1, Math.min(1, value)) * 32767);
    pcm.writeInt16LE(integerValue, sampleIndex * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

mkdirSync(outputDirectory, { recursive: true });
for (const [name, definition] of Object.entries(soundDefinitions)) {
  writeFileSync(join(outputDirectory, `${name}.wav`), renderSound(definition));
}

console.log(`Generated ${Object.keys(soundDefinitions).length} sounds in ${outputDirectory}`);
