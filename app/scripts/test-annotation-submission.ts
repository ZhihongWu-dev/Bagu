import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadManifest } from './nowcoder-intake/manifest';
import type { SourceManifest } from './nowcoder-intake/types';
import { validateSubmissionDirectory } from './nowcoder-annotation/submission-files';
import {
  ANSWER_CUE_TYPES,
  COGNITIVE_LEVELS,
  DISTRACTOR_TYPES,
  FOLLOW_UP_TYPES,
  MISCONCEPTION_TYPES,
  SKIP_REASONS,
  TOPIC_IDS,
} from './nowcoder-annotation/taxonomy';
import {
  ANNOTATION_SUBMISSION_ID,
  buildAnnotationSubmission,
  serializeAnnotationSubmission,
  validateAnnotationSubmission,
} from './nowcoder-annotation/submission';
import type { ManualAnnotation, ManualAnnotationDataset } from './nowcoder-annotation/types';

function completeDataset(manifest: SourceManifest): ManualAnnotationDataset {
  const annotations: Record<string, ManualAnnotation> = {};
  manifest.sources.forEach((source, index) => {
    if (index === manifest.sources.length - 1) {
      annotations[source.sourceId] = {
        sourceId: source.sourceId,
        status: 'skipped',
        skipReason: 'cannot-assess',
        skipNote: 'private skip note',
        updatedAt: '2026-08-18T12:00:00.000Z',
      };
      return;
    }
    annotations[source.sourceId] = {
      sourceId: source.sourceId,
      status: 'completed',
      relevance: index === 1 ? 'uncertain' : 'relevant',
      ...(index === 1 ? {} : {
        role: index % 2 === 0 ? 'llm_application' : 'llm_algorithm',
        recruitingStage: 'campus-autumn',
        topicIds: ['rag-retrieval-rerank', 'transformer-attention'],
        followUpTypes: ['tradeoff', 'debugging'],
        misconceptionTypes: ['metric-misuse', 'missing-condition'],
        ...(source.pageType === 'multiple-choice' ? {
          choiceSignals: {
            cognitiveLevel: 'application' as const,
            distractorTypes: ['non-unique-answer', 'overlap'] as const,
            answerCueTypes: ['stem-repeat', 'length'] as const,
          },
        } : {}),
      }),
      summary: 'private summary that must not be published',
      updatedAt: '2026-08-18T12:00:00.000Z',
    };
  });
  return { schemaVersion: 1, manifestVersion: 1, annotations };
}

function expectError(fn: () => unknown, expected: RegExp): void {
  assert.throws(fn, expected);
}

interface SubmissionSchemaContract {
  properties: { records: { minItems: number; maxItems: number } };
  $defs: {
    topicIds: { items: { enum: string[] } };
    followUpTypes: { items: { enum: string[] } };
    misconceptionTypes: { items: { enum: string[] } };
    choiceSignals: { properties: {
      cognitiveLevel: { enum: string[] };
      distractorTypes: { items: { enum: string[] } };
      answerCueTypes: { items: { enum: string[] } };
    } };
    record: { oneOf: [{ properties: { skipReason: { enum: string[] } } }] };
  };
}

async function main(): Promise<void> {
  const manifest = await loadManifest('quality/nowcoder-intake/manifests/pilot-100.json');
  const schema = JSON.parse(await readFile(
    'quality/nowcoder-intake/schemas/annotation-submission.schema.json',
    'utf8',
  )) as SubmissionSchemaContract;
  assert.equal(schema.properties.records.minItems, manifest.sources.length);
  assert.equal(schema.properties.records.maxItems, manifest.sources.length);
  assert.deepEqual(schema.$defs.topicIds.items.enum, [...TOPIC_IDS]);
  assert.deepEqual(schema.$defs.followUpTypes.items.enum, [...FOLLOW_UP_TYPES]);
  assert.deepEqual(schema.$defs.misconceptionTypes.items.enum, [...MISCONCEPTION_TYPES]);
  assert.deepEqual(schema.$defs.choiceSignals.properties.cognitiveLevel.enum, [...COGNITIVE_LEVELS]);
  assert.deepEqual(schema.$defs.choiceSignals.properties.distractorTypes.items.enum, [...DISTRACTOR_TYPES]);
  assert.deepEqual(schema.$defs.choiceSignals.properties.answerCueTypes.items.enum, [...ANSWER_CUE_TYPES]);
  assert.deepEqual(schema.$defs.record.oneOf[0].properties.skipReason.enum, [...SKIP_REASONS]);
  const dataset = completeDataset(manifest);
  const generatedAt = '2026-08-18T13:00:00.000Z';
  const submission = buildAnnotationSubmission(manifest, dataset, generatedAt);

  assert.equal(submission.schemaVersion, 1);
  assert.equal(submission.manifestVersion, 1);
  assert.equal(submission.submissionId, ANNOTATION_SUBMISSION_ID);
  assert.equal(submission.records.length, 59);
  assert.deepEqual(submission.records.map((record) => record.sourceId), manifest.sources.map((source) => source.sourceId));
  assert.deepEqual(submission.records[0].topicIds, ['transformer-attention', 'rag-retrieval-rerank']);
  assert.deepEqual(submission.records[0].followUpTypes, ['debugging', 'tradeoff']);
  assert.deepEqual(submission.records[0].misconceptionTypes, ['missing-condition', 'metric-misuse']);

  const serialized = serializeAnnotationSubmission(submission);
  for (const forbidden of ['private summary', 'private skip note', 'summary', 'skipNote', 'updatedAt', 'https://www.nowcoder.com', 'discoveryQuery']) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} must not be published`);
  }
  assert.equal(serialized, serializeAnnotationSubmission(buildAnnotationSubmission(manifest, dataset, generatedAt)));
  assert.deepEqual(validateAnnotationSubmission(JSON.parse(serialized), manifest), submission);

  const missingDataset = completeDataset(manifest);
  delete missingDataset.annotations[manifest.sources[0].sourceId];
  expectError(() => buildAnnotationSubmission(manifest, missingDataset, generatedAt), /submission_incomplete/);

  const pendingDataset = completeDataset(manifest);
  pendingDataset.annotations[manifest.sources[0].sourceId] = {
    sourceId: manifest.sources[0].sourceId,
    status: 'pending',
    updatedAt: generatedAt,
  };
  expectError(() => buildAnnotationSubmission(manifest, pendingDataset, generatedAt), /submission_incomplete/);

  const extraTopLevel = { ...submission, note: 'forbidden free text' };
  expectError(() => validateAnnotationSubmission(extraTopLevel, manifest), /invalid_submission_shape/);

  const extraRecord = structuredClone(submission) as unknown as { records: Record<string, unknown>[] };
  extraRecord.records[0].summary = 'forbidden';
  expectError(() => validateAnnotationSubmission(extraRecord, manifest), /invalid_submission_record_shape/);

  const missingRecord = structuredClone(submission);
  missingRecord.records.pop();
  expectError(() => validateAnnotationSubmission(missingRecord, manifest), /submission_incomplete/);

  const duplicateRecord = structuredClone(submission);
  duplicateRecord.records[1] = structuredClone(duplicateRecord.records[0]);
  expectError(() => validateAnnotationSubmission(duplicateRecord, manifest), /duplicate_submission_source/);

  const wrongOrder = structuredClone(submission);
  [wrongOrder.records[0], wrongOrder.records[1]] = [wrongOrder.records[1], wrongOrder.records[0]];
  expectError(() => validateAnnotationSubmission(wrongOrder, manifest), /invalid_submission_order/);

  const unknownSource = structuredClone(submission);
  unknownSource.records[0].sourceId = 'nc-unknown-999';
  expectError(() => validateAnnotationSubmission(unknownSource, manifest), /unknown_submission_source/);

  const interviewIndex = manifest.sources.findIndex((source, index) => source.pageType === 'interview' && submission.records[index].relevance === 'relevant');
  const wrongPageType = structuredClone(submission);
  wrongPageType.records[interviewIndex].choiceSignals = {
    cognitiveLevel: 'application',
    distractorTypes: [],
    answerCueTypes: [],
  };
  expectError(() => validateAnnotationSubmission(wrongPageType, manifest), /interview_must_not_contain_choice_signals/);

  const badTimestamp = { ...submission, generatedAt: 'not-a-date' };
  expectError(() => validateAnnotationSubmission(badTimestamp, manifest), /invalid_submission_generatedAt/);

  const directory = resolve('.tmp-annotation-submission-test');
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  try {
    assert.deepEqual(await validateSubmissionDirectory(directory, manifest), { submissionCount: 0 });
    await writeFile(join(directory, 'wrong.json'), serialized, 'utf8');
    await assert.rejects(() => validateSubmissionDirectory(directory, manifest), /invalid_submission_filename/);
    await rm(join(directory, 'wrong.json'));
    await writeFile(join(directory, 'pilot-100-v1.json'), '{broken', 'utf8');
    await assert.rejects(() => validateSubmissionDirectory(directory, manifest), /invalid_submission_json/);
    await writeFile(join(directory, 'pilot-100-v1.json'), serialized, 'utf8');
    assert.deepEqual(await validateSubmissionDirectory(directory, manifest), {
      submissionCount: 1,
      submissionPath: join(directory, 'pilot-100-v1.json'),
    });
    await writeFile(join(directory, 'extra.json'), serialized, 'utf8');
    await assert.rejects(() => validateSubmissionDirectory(directory, manifest), /invalid_submission_filename/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  console.log('annotation submission tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
