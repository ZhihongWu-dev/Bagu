import assert from 'node:assert/strict';

import type { Exercise, LearningNode } from '../src/types/course';
import {
  normalizeQuestionText,
  validateBaselineFiles,
  validateExerciseQuality,
  validateNodeQuality,
  validateQuestionReviewRecord,
  validateSectionQuality,
} from './validate-question-quality';

const baseQuestion: Exercise = {
  id: 'fixture-v2-01',
  questionVersion: 2,
  cognitiveLevel: 'foundation',
  learningObjectiveId: 'fixture.objective',
  type: 'single-choice',
  eyebrow: '测试',
  prompt: '在自注意力中，哪个描述正确区分了 Query 与 Value 的职责？',
  explanation: 'Query 表达当前查询需求，Value 携带按注意力权重聚合的内容；两者来自不同的可学习投影。',
  coveredPoints: ['Query 用于匹配', 'Value 被聚合'],
  keywords: ['query'],
  choices: [
    { id: 'a', label: 'Query 用于匹配，Value 携带待聚合内容' },
    { id: 'b', label: 'Value 决定因果遮罩允许访问的位置' },
    { id: 'c', label: 'Query 是 Softmax 后的概率向量' },
    { id: 'd', label: 'Query 与 Value 必须共享投影参数' },
  ],
  correctChoiceId: 'a',
};

const withChanges = (changes: Partial<Exercise>): Exercise => ({ ...baseQuestion, ...changes } as Exercise);
const ruleIds = (exercise: Exercise) => validateExerciseQuality(exercise).map((item) => item.ruleId);

assert.equal(normalizeQuestionText(' Q = XW_Q '), normalizeQuestionText('\\(Q=XW_{Q}\\)'));
assert.deepEqual(validateExerciseQuality(baseQuestion), []);

const leakedFormula = withChanges({
  id: 'qkv-roles-v2-07',
  formula: { plainText: 'Q=XW_Q, K=XW_K, V=XW_V', latex: 'Q=XW_Q,K=XW_K,V=XW_V' },
  choices: [
    { id: 'a', label: 'Q、K、V 必须共享一个投影矩阵' },
    { id: 'b', label: 'Value 决定哪些位置会被遮罩' },
    { id: 'c', label: 'Q=XW_Q, K=XW_K, V=XW_V', formula: { plainText: 'Q=XW_Q, K=XW_K, V=XW_V', latex: 'Q=XW_Q,K=XW_K,V=XW_V' } },
    { id: 'd', label: 'Query 是最终输出概率' },
  ],
  correctChoiceId: 'c',
});
assert.ok(ruleIds(leakedFormula).includes('answer-leakage'), '顶部公式与正确选项重复必须被拦截。');

const duplicateOptions = withChanges({
  choices: [
    { id: 'a', label: '相同答案' },
    { id: 'b', label: '相 同 答 案' },
    { id: 'c', label: '不同答案一' },
    { id: 'd', label: '不同答案二' },
  ],
});
assert.ok(ruleIds(duplicateOptions).includes('duplicate-option'));
assert.ok(ruleIds(withChanges({ correctChoiceId: 'missing' } as Partial<Exercise>)).includes('invalid-answer-structure'));
assert.ok(ruleIds(withChanges({ explanation: '   ' })).includes('empty-explanation'));
assert.ok(ruleIds(withChanges({ learningObjectiveId: undefined })).includes('missing-v2-metadata'));

const quotaLevels = [
  'foundation', 'foundation', 'foundation',
  'application', 'application', 'application', 'application', 'application', 'application',
  'deep', 'deep', 'deep',
] as const;
const validNode: LearningNode = {
  id: 'fixture',
  title: 'fixture',
  shortTitle: 'fixture',
  subtitle: 'fixture',
  icon: 'search',
  duration: 10,
  knowledgeIds: [],
  exercises: quotaLevels.map((cognitiveLevel, index) => withChanges({ id: `fixture-v2-${String(index + 1).padStart(2, '0')}`, cognitiveLevel })),
};
assert.ok(!validateNodeQuality(validNode).some((item) => item.ruleId === 'invalid-cognitive-quota'));
const invalidNode = { ...validNode, exercises: validNode.exercises.map((exercise) => ({ ...exercise, cognitiveLevel: 'application' as const })) };
assert.ok(validateNodeQuality(invalidNode).some((item) => item.ruleId === 'invalid-cognitive-quota'));

const objectiveExercise = (id: string, correctCount: 2 | 3): Exercise => ({
  ...baseQuestion,
  id,
  type: 'multiple-choice',
  choices: baseQuestion.type === 'single-choice' ? baseQuestion.choices : [],
  correctChoiceIds: correctCount === 2 ? ['a', 'c'] : ['a', 'c', 'd'],
});
const sectionNode = (exercises: Exercise[]): LearningNode => ({ ...validNode, exercises });

const fixedCardinalitySection = validateSectionQuality('fixture-section', [sectionNode([
  objectiveExercise('multi-01', 3),
  objectiveExercise('multi-02', 3),
  objectiveExercise('multi-03', 3),
  objectiveExercise('multi-04', 3),
])]);
assert.ok(fixedCardinalitySection.some((item) => item.ruleId === 'fixed-multiple-answer-count'), '同一 v2 Section 的多选题不能全部固定为四选三。');

const variedCardinalitySection = validateSectionQuality('fixture-section', [sectionNode([
  objectiveExercise('multi-01', 2),
  objectiveExercise('multi-02', 3),
  objectiveExercise('multi-03', 2),
  objectiveExercise('multi-04', 3),
])]);
assert.ok(!variedCardinalitySection.some((item) => item.ruleId === 'fixed-multiple-answer-count'));
const dominantCardinalitySection = validateSectionQuality('fixture-section', [sectionNode([
  objectiveExercise('multi-01', 3),
  objectiveExercise('multi-02', 3),
  objectiveExercise('multi-03', 3),
  objectiveExercise('multi-04', 3),
  objectiveExercise('multi-05', 2),
])]);
assert.ok(dominantCardinalitySection.some((item) => item.ruleId === 'fixed-multiple-answer-count'), '即使有两种基数，单一基数超过 75% 仍须失败。');

const orderedExercise: Exercise = {
  ...baseQuestion,
  id: 'ordering-v2-01',
  type: 'ordering',
  choices: [
    { id: 'a', label: '第一步' },
    { id: 'b', label: '第二步' },
    { id: 'c', label: '第三步' },
  ],
  correctOrder: ['a', 'b', 'c'],
};
assert.ok(ruleIds(orderedExercise).includes('unshuffled-ordering'), '排序题展示顺序不得已经等于正确顺序。');
assert.ok(!ruleIds({ ...orderedExercise, choices: [orderedExercise.choices[2], orderedExercise.choices[0], orderedExercise.choices[1]] }).includes('unshuffled-ordering'));
assert.ok(!ruleIds({ ...orderedExercise, questionVersion: undefined }).includes('unshuffled-ordering'), 'v1 旧题在迁移期只报告旧版本，不启用新排序硬门槛。');

const singleAt = (id: string, correctChoiceId: 'a' | 'b' | 'c' | 'd'): Exercise => withChanges({ id, correctChoiceId } as Partial<Exercise>);
const allowedSingleDistribution = [
  ...Array.from({ length: 8 }, (_, index) => singleAt(`a-${index}`, 'a')),
  ...Array.from({ length: 10 }, (_, index) => singleAt(`b-${index}`, 'b')),
  ...Array.from({ length: 8 }, (_, index) => singleAt(`c-${index}`, 'c')),
  ...Array.from({ length: 8 }, (_, index) => singleAt(`d-${index}`, 'd')),
];
assert.ok(!validateSectionQuality('allowed-position-section', [sectionNode(allowedSingleDistribution)]).some((item) => item.ruleId === 'biased-single-choice-position'));
const biasedSingleDistribution = allowedSingleDistribution.map((exercise, index) => exercise.type === 'single-choice' && index < 18 ? { ...exercise, correctChoiceId: 'a' } : exercise);
assert.ok(validateSectionQuality('biased-position-section', [sectionNode(biasedSingleDistribution)]).some((item) => item.ruleId === 'biased-single-choice-position'));

const calibratedPass = {
  schemaVersion: 1,
  questionId: 'fixture-v2-01',
  questionVersion: 2,
  calibrationStatus: 'calibrated',
  evidenceReview: { reviewerRole: 'evidence', verdict: 'pass', findings: [] },
  itemQualityReview: { reviewerRole: 'item-quality', verdict: 'pass', findings: [] },
  hardGates: {
    factuallyCorrect: true,
    uniqueAnswer: true,
    conditionsComplete: true,
    sourcesVerifiable: true,
    noAnswerLeakage: true,
    explanationAligned: true,
  },
  anchoredScores: {
    reasoningDepth: { score: 3, reason: '需要有效判断。' },
    distractorQuality: { score: 3, reason: '干扰项来自不同误区。' },
    explanationAlignment: { score: 3, reason: '解析覆盖正确项与主要差异。' },
    clarity: { score: 4, reason: '条件完整且无形式提示。' },
  },
  verdict: 'pass',
};
assert.deepEqual(validateQuestionReviewRecord(calibratedPass), []);
assert.ok(validateQuestionReviewRecord({ ...calibratedPass, calibrationStatus: 'uncalibrated' }).some((item) => item.reason.includes('未校准')));
assert.ok(validateQuestionReviewRecord({ ...calibratedPass, anchoredScores: { ...calibratedPass.anchoredScores, reasoningDepth: { score: 1, reason: '仅需抄写。' } } }).some((item) => item.reason.includes('13/16')));
assert.ok(validateQuestionReviewRecord({ ...calibratedPass, hardGates: { ...calibratedPass.hardGates, uniqueAnswer: false } }).some((item) => item.reason.includes('六项硬门槛')));
assert.ok(validateQuestionReviewRecord({ ...calibratedPass, itemQualityReview: { reviewerRole: 'item-quality', verdict: 'revise', findings: [] }, verdict: 'pass' }).some((item) => item.reason.includes('冲突')));
assert.ok(validateQuestionReviewRecord({ ...calibratedPass, evidenceReview: { reviewerRole: 'evidence', verdict: 'pass', findings: [{ code: '', reason: '', evidence: '' }] } }).some((item) => item.reason.includes('finding')));

const baseline = {
  nodeCount: 1,
  exerciseCount: 1,
  exerciseIdSuffixes: ['01'],
  nodes: ['node'],
};
const migration = {
  legacyExerciseCount: 1,
  suffixes: ['01'],
  nodes: [{ nodeId: 'node', legacyPrefix: 'node-', replacementPrefix: 'node-v2-' }],
};
assert.ok(validateBaselineFiles(baseline, migration).some((item) => item.ruleId === 'invalid-baseline'));

console.log('Question quality tests passed: leakage, structure, answer distributions, ordering, metadata, quotas, baseline, and review release gates.');
