import assert from 'node:assert/strict';

import {
  createQuestionAnnotationState,
  getAnnotationBatch,
  getAnnotationProgress,
  normalizeQuestionAnnotationState,
  upsertQuestionAnnotation,
} from '../src/question-review/annotation-data';
import { exportAnnotationsAsCsv, exportAnnotationsAsJson } from '../src/question-review/export';
import type { QuestionAnnotationInput } from '../src/question-review/types';
import {
  clearQuestionAnnotations,
  loadQuestionAnnotations,
  saveQuestionAnnotations,
} from '../src/storage/question-annotation-storage';

const questionIds = Array.from({ length: 23 }, (_, index) => `qkv-roles-${String(index + 1).padStart(2, '0')}`);
const baseInput: QuestionAnnotationInput = {
  answerBasis: 'reasoning',
  clarity: 4,
  multipleAnswerSuspicion: false,
  distractorPlausibility: 3,
  cueType: 'none',
  explanationHelpfulness: 5,
  perceivedDifficulty: 2,
};

let state = createQuestionAnnotationState('transformer-v2', questionIds, '2026-08-16T10:00:00.000Z');
assert.deepEqual(getAnnotationBatch(state, 1), questionIds.slice(0, 10));
assert.deepEqual(getAnnotationBatch(state, 3), questionIds.slice(20));
assert.deepEqual(getAnnotationBatch(state, 4), []);

for (let index = 0; index < 12; index += 1) {
  state = upsertQuestionAnnotation(
    state,
    questionIds[index],
    2,
    index === 0 ? { ...baseInput, note: '逗号, 引号"与\n换行' } : baseInput,
    `2026-08-16T10:${String(index).padStart(2, '0')}:00.000Z`,
  );
}

const progress = getAnnotationProgress(state);
assert.deepEqual(progress, {
  total: 23,
  completed: 12,
  remaining: 11,
  completionRate: 12 / 23,
  batchCount: 3,
  completedBatches: 1,
  currentBatch: 2,
  resumeQuestionId: questionIds[12],
});
assert.equal(state.records[questionIds[10]].batchNumber, 2);

const roundTrip = normalizeQuestionAnnotationState(JSON.parse(exportAnnotationsAsJson(state)));
assert.deepEqual(roundTrip, state);

const csv = exportAnnotationsAsCsv(state);
assert.equal(csv.split('\r\n').length, 13);
assert.ok(csv.includes('"逗号, 引号""与\n换行"'));
assert.ok(csv.includes(`${questionIds[0]},2,1`));

assert.throws(() => upsertQuestionAnnotation(state, 'missing-question', 2, baseInput));
assert.throws(() => upsertQuestionAnnotation(state, questionIds[0], 2, { ...baseInput, clarity: 0 as 1 }));

async function testWebStorageRoundTrip() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });

  await saveQuestionAnnotations(state);
  assert.deepEqual(await loadQuestionAnnotations(), state);
  await clearQuestionAnnotations();
  assert.equal(await loadQuestionAnnotations(), null);
}

testWebStorageRoundTrip()
  .then(() => console.log('question annotation tests passed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
