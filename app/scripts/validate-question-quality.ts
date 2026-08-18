import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Choice, Exercise, LearningNode } from '../src/types/course';

export type QuestionQualityRuleId =
  | 'answer-leakage'
  | 'duplicate-option'
  | 'empty-explanation'
  | 'fixed-multiple-answer-count'
  | 'invalid-answer-structure'
  | 'invalid-baseline'
  | 'invalid-cognitive-quota'
  | 'invalid-review'
  | 'legacy-question'
  | 'missing-v2-metadata'
  | 'mixed-node-version'
  | 'biased-single-choice-position'
  | 'unshuffled-ordering';

export type QuestionQualityIssue = {
  ruleId: QuestionQualityRuleId;
  severity: 'error' | 'warning';
  questionId: string;
  reason: string;
};

type Baseline = {
  nodeCount: number;
  exerciseCount: number;
  exerciseIdSuffixes: string[];
  nodes: string[];
};

type Migration = {
  legacyExerciseCount: number;
  suffixes: string[];
  nodes: { nodeId: string; legacyPrefix: string; replacementPrefix: string }[];
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(scriptDirectory, '..');
const qualityDirectory = join(appDirectory, 'quality', 'transformer');

export function normalizeQuestionText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/\\(?:mathrm|text|operatorname|mathbf|mathit|left|right)/g, '')
    .replace(/[^\p{Letter}\p{Number}]/gu, '');
}

function issue(
  ruleId: QuestionQualityRuleId,
  severity: QuestionQualityIssue['severity'],
  questionId: string,
  reason: string,
): QuestionQualityIssue {
  return { ruleId, severity, questionId, reason };
}

function choiceRepresentations(choice: Choice): string[] {
  return [choice.label, choice.formula?.plainText, choice.formula?.latex]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizeQuestionText)
    .filter(Boolean);
}

function correctChoices(exercise: Exercise): Choice[] {
  if (exercise.type === 'single-choice') {
    return exercise.choices.filter((choice) => choice.id === exercise.correctChoiceId);
  }
  if (exercise.type === 'multiple-choice') {
    const correctIds = new Set(exercise.correctChoiceIds);
    return exercise.choices.filter((choice) => correctIds.has(choice.id));
  }
  return [];
}

function validateAnswerStructure(exercise: Exercise): string[] {
  if (exercise.type === 'self-recall') {
    return exercise.referencePoints.length > 0 ? [] : ['口述题必须至少包含一个参考要点。'];
  }

  const choiceIds = exercise.choices.map((choice) => choice.id);
  const idSet = new Set(choiceIds);
  const reasons: string[] = [];
  if (idSet.size !== choiceIds.length) reasons.push('选项 ID 必须唯一。');

  if (exercise.type === 'single-choice') {
    if (!idSet.has(exercise.correctChoiceId)) reasons.push('单选题正确答案必须且只能指向一个现有选项。');
  } else if (exercise.type === 'multiple-choice') {
    if (exercise.correctChoiceIds.length === 0) reasons.push('多选题正确答案不能为空。');
    if (new Set(exercise.correctChoiceIds).size !== exercise.correctChoiceIds.length) reasons.push('多选题正确答案 ID 不能重复。');
    if (exercise.correctChoiceIds.some((id) => !idSet.has(id))) reasons.push('多选题正确答案必须全部指向现有选项。');
  } else {
    if (exercise.correctOrder.length !== choiceIds.length) reasons.push('排序答案必须覆盖全部选项。');
    if (new Set(exercise.correctOrder).size !== choiceIds.length) reasons.push('排序答案不能遗漏或重复选项。');
    if (exercise.correctOrder.some((id) => !idSet.has(id))) reasons.push('排序答案必须全部指向现有选项。');
  }
  return reasons;
}

export function validateExerciseQuality(exercise: Exercise): QuestionQualityIssue[] {
  const isV2 = (exercise.questionVersion ?? 1) >= 2;
  const strictSeverity: QuestionQualityIssue['severity'] = isV2 ? 'error' : 'warning';
  const issues: QuestionQualityIssue[] = [];

  if (exercise.questionVersion !== undefined && (!Number.isInteger(exercise.questionVersion) || exercise.questionVersion < 2)) {
    issues.push(issue('missing-v2-metadata', 'error', exercise.id, 'questionVersion 存在时必须是大于等于 2 的整数。'));
  }

  if (!isV2) {
    issues.push(issue('legacy-question', 'warning', exercise.id, '仍是 v1 基线题；迁移期允许存在，但不能视为已通过新质量门禁。'));
  } else {
    if (!exercise.cognitiveLevel) {
      issues.push(issue('missing-v2-metadata', 'error', exercise.id, 'v2 题缺少 cognitiveLevel。'));
    }
    if (!exercise.learningObjectiveId?.trim()) {
      issues.push(issue('missing-v2-metadata', 'error', exercise.id, 'v2 题缺少 learningObjectiveId。'));
    }
  }

  if (!exercise.explanation.trim()) {
    issues.push(issue('empty-explanation', 'error', exercise.id, '解析不能为空。'));
  }

  validateAnswerStructure(exercise).forEach((reason) => {
    issues.push(issue('invalid-answer-structure', 'error', exercise.id, reason));
  });

  if (exercise.type !== 'self-recall') {
    const seen = new Map<string, string>();
    exercise.choices.forEach((choice) => {
      const normalized = normalizeQuestionText(choice.formula?.plainText ?? choice.label);
      if (!normalized) return;
      const previousId = seen.get(normalized);
      if (previousId) {
        issues.push(issue('duplicate-option', 'error', exercise.id, `选项 ${previousId} 与 ${choice.id} 规范化后完全相同。`));
      } else {
        seen.set(normalized, choice.id);
      }
    });

    const visibleSources = [exercise.prompt, exercise.formula?.plainText, exercise.formula?.latex]
      .filter((value): value is string => Boolean(value?.trim()))
      .map(normalizeQuestionText)
      .filter(Boolean);
    const formulaSources = [exercise.formula?.plainText, exercise.formula?.latex]
      .filter((value): value is string => Boolean(value?.trim()))
      .map(normalizeQuestionText)
      .filter(Boolean);

    for (const correctChoice of correctChoices(exercise)) {
      for (const answer of choiceRepresentations(correctChoice)) {
        if (answer.length < 6) continue;
        const exactFormulaMatch = formulaSources.some((source) => source === answer);
        const longPromptCopy = answer.length >= 10 && visibleSources.some((source) => source.includes(answer));
        if (exactFormulaMatch || longPromptCopy) {
          issues.push(issue(
            'answer-leakage',
            strictSeverity,
            exercise.id,
            `正确选项 ${correctChoice.id} 可从题干或顶部公式直接规范化匹配，无需完成目标推理。`,
          ));
          break;
        }
      }
    }

    if (
      isV2
      && exercise.type === 'ordering'
      && exercise.choices.map((choice) => choice.id).join('|') === exercise.correctOrder.join('|')
    ) {
      issues.push(issue(
        'unshuffled-ordering',
        'error',
        exercise.id,
        '排序题的运行时展示顺序已经等于正确顺序，用户无需排序即可作答。',
      ));
    }
  }

  return issues;
}

export function validateNodeQuality(node: LearningNode): QuestionQualityIssue[] {
  const issues = node.exercises.flatMap(validateExerciseQuality);
  const v2Count = node.exercises.filter((exercise) => (exercise.questionVersion ?? 1) >= 2).length;
  if (v2Count > 0 && v2Count !== node.exercises.length) {
    issues.push(issue('mixed-node-version', 'error', node.id, `同一节点不能混用 v1 与 v2；当前 ${v2Count}/${node.exercises.length} 为 v2。`));
  }
  if (v2Count === node.exercises.length) {
    const counts = { foundation: 0, application: 0, deep: 0 };
    node.exercises.forEach((exercise) => {
      if (exercise.cognitiveLevel) counts[exercise.cognitiveLevel] += 1;
    });
    if (counts.foundation !== 3 || counts.application !== 6 || counts.deep !== 3) {
      issues.push(issue(
        'invalid-cognitive-quota',
        'error',
        node.id,
        `v2 节点认知层级必须为 3/6/3，当前为 ${counts.foundation}/${counts.application}/${counts.deep}。`,
      ));
    }
  }
  return issues;
}

export function validateSectionQuality(sectionId: string, nodes: LearningNode[]): QuestionQualityIssue[] {
  const issues: QuestionQualityIssue[] = [];
  const v2Exercises = nodes.flatMap((node) => node.exercises).filter((exercise) => (exercise.questionVersion ?? 1) >= 2);
  const multipleChoiceExercises = v2Exercises.filter((exercise) => exercise.type === 'multiple-choice');

  if (multipleChoiceExercises.length >= 4) {
    const cardinalityCounts = new Map<number, number>();
    multipleChoiceExercises.forEach((exercise) => {
      const count = exercise.correctChoiceIds.length;
      cardinalityCounts.set(count, (cardinalityCounts.get(count) ?? 0) + 1);
    });
    const dominantCount = Math.max(...cardinalityCounts.values());
    const dominantRatio = dominantCount / multipleChoiceExercises.length;
    if (cardinalityCounts.size < 2 || dominantRatio > 0.75) {
      const distribution = [...cardinalityCounts.entries()]
        .sort(([left], [right]) => left - right)
        .map(([count, frequency]) => `${count}个正确项=${frequency}题`)
        .join('，');
      issues.push(issue(
        'fixed-multiple-answer-count',
        'error',
        sectionId,
        `v2 Section 的多选题须至少包含两种正确项基数，且任一基数占比不得超过 75%；当前 ${distribution}。`,
      ));
    }
  }

  const singleChoiceExercises = v2Exercises.filter((exercise) => exercise.type === 'single-choice');
  if (singleChoiceExercises.length >= 12) {
    const positionCounts = [0, 0, 0, 0];
    singleChoiceExercises.forEach((exercise) => {
      const position = exercise.choices.findIndex((choice) => choice.id === exercise.correctChoiceId);
      if (position >= 0 && position < positionCounts.length) positionCounts[position] += 1;
    });
    const dominantRatio = Math.max(...positionCounts) / singleChoiceExercises.length;
    if (dominantRatio > 0.4) {
      issues.push(issue(
        'biased-single-choice-position',
        'error',
        sectionId,
        `v2 Section 的单选正确位置过度集中；A/B/C/D 分布为 ${positionCounts.join('/')}，单一位置不得超过 40%。`,
      ));
    }
  }

  return issues;
}

export function validateBaselineFiles(baseline: Baseline, migration: Migration): QuestionQualityIssue[] {
  const issues: QuestionQualityIssue[] = [];
  const baselineIds = baseline.nodes.flatMap((nodeId) => baseline.exerciseIdSuffixes.map((suffix) => `${nodeId}-${suffix}`));
  const migrationIds = migration.nodes.flatMap((node) => migration.suffixes.map((suffix) => `${node.legacyPrefix}${suffix}`));
  const add = (reason: string) => issues.push(issue('invalid-baseline', 'error', 'transformer-baseline', reason));

  if (baseline.nodes.length !== baseline.nodeCount || baseline.nodeCount !== 25) add('baseline 必须记录 25 个节点。');
  if (baselineIds.length !== baseline.exerciseCount || baseline.exerciseCount !== 300) add('baseline 必须可展开为 300 个旧题 ID。');
  if (new Set(baselineIds).size !== 300) add('baseline 展开的旧题 ID 必须唯一。');
  if (migration.nodes.length !== 25 || migrationIds.length !== migration.legacyExerciseCount || migration.legacyExerciseCount !== 300) add('迁移清单必须覆盖全部 300 个旧题 ID。');
  if (baselineIds.some((id, index) => migrationIds[index] !== id)) add('迁移清单的旧题 ID 与 baseline 不一致。');
  if (migration.nodes.some((node) => node.nodeId !== node.legacyPrefix.slice(0, -1))) add('迁移清单 nodeId 与 legacyPrefix 不一致。');
  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateQuestionReviewRecord(record: unknown, fileName = 'review'): QuestionQualityIssue[] {
  const issues: QuestionQualityIssue[] = [];
  const add = (reason: string) => issues.push(issue('invalid-review', 'error', fileName, reason));
  if (!isRecord(record)) {
    add('审题记录必须是 JSON 对象。');
    return issues;
  }

  const questionId = typeof record.questionId === 'string' ? record.questionId : fileName;
  const calibrationStatus = record.calibrationStatus;
  const verdict = record.verdict;
  const hardGates = record.hardGates;
  const anchoredScores = record.anchoredScores;
  const roleReviews = [record.evidenceReview, record.itemQualityReview];
  const validVerdicts = new Set(['pass', 'revise', 'reject', 'uncalibrated']);
  const gateNames = ['factuallyCorrect', 'uniqueAnswer', 'conditionsComplete', 'sourcesVerifiable', 'noAnswerLeakage', 'explanationAligned'];
  const scoreNames = ['reasoningDepth', 'distractorQuality', 'explanationAlignment', 'clarity'];

  if (record.schemaVersion !== 1) add(`${questionId}: schemaVersion 必须为 1。`);
  if (!Number.isInteger(record.questionVersion) || Number(record.questionVersion) < 2) add(`${questionId}: questionVersion 必须为大于等于 2 的整数。`);
  if (calibrationStatus !== 'calibrated' && calibrationStatus !== 'uncalibrated') add(`${questionId}: calibrationStatus 无效。`);
  if (!validVerdicts.has(String(verdict))) add(`${questionId}: verdict 无效。`);
  if (!isRecord(hardGates) || gateNames.some((name) => typeof hardGates[name] !== 'boolean')) add(`${questionId}: 必须显式记录六项布尔硬门槛。`);

  const scores: number[] = [];
  if (!isRecord(anchoredScores)) {
    add(`${questionId}: 缺少四项锚定评分。`);
  } else {
    scoreNames.forEach((name) => {
      const scoreRecord = anchoredScores[name];
      if (!isRecord(scoreRecord) || !Number.isInteger(scoreRecord.score) || Number(scoreRecord.score) < 0 || Number(scoreRecord.score) > 4 || typeof scoreRecord.reason !== 'string' || !scoreRecord.reason.trim()) {
        add(`${questionId}: ${name} 必须包含 0-4 整数分和非空理由。`);
      } else {
        scores.push(Number(scoreRecord.score));
      }
    });
  }

  roleReviews.forEach((roleReview, index) => {
    const expectedRole = index === 0 ? 'evidence' : 'item-quality';
    if (!isRecord(roleReview) || roleReview.reviewerRole !== expectedRole || !validVerdicts.has(String(roleReview.verdict)) || !Array.isArray(roleReview.findings)) {
      add(`${questionId}: ${expectedRole} 审题输出结构无效。`);
      return;
    }
    roleReview.findings.forEach((finding, findingIndex) => {
      if (
        !isRecord(finding)
        || typeof finding.code !== 'string'
        || !finding.code.trim()
        || typeof finding.reason !== 'string'
        || !finding.reason.trim()
        || typeof finding.evidence !== 'string'
        || !finding.evidence.trim()
      ) {
        add(`${questionId}: ${expectedRole} 第 ${findingIndex + 1} 条 finding 必须包含非空 code、reason 和 evidence。`);
      }
    });
  });

  if (calibrationStatus === 'uncalibrated') {
    if (verdict === 'pass' || roleReviews.some((review) => isRecord(review) && review.verdict === 'pass')) {
      add(`${questionId}: 未校准记录不得出现 pass。`);
    }
  }

  if (verdict === 'pass') {
    if (calibrationStatus !== 'calibrated') add(`${questionId}: 发布通过必须处于 calibrated。`);
    if (!isRecord(hardGates) || gateNames.some((name) => hardGates[name] !== true)) add(`${questionId}: 发布通过要求六项硬门槛全部为 true。`);
    if (scores.length !== 4 || scores.reduce((sum, score) => sum + score, 0) < 13 || Math.min(...scores) < 2) add(`${questionId}: 发布通过要求总分至少 13/16 且单项不低于 2。`);
    if (roleReviews.some((review) => !isRecord(review) || review.verdict !== 'pass')) add(`${questionId}: 发布通过要求两个独立角色均为 pass。`);
  }

  const roleVerdicts = roleReviews.filter(isRecord).map((review) => review.verdict);
  if (roleVerdicts.length === 2 && roleVerdicts[0] !== roleVerdicts[1] && verdict !== 'revise') {
    add(`${questionId}: 两个角色结论冲突时整题必须为 revise。`);
  }
  return issues;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function reviewFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? reviewFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

export async function runQuestionValidation(): Promise<QuestionQualityIssue[]> {
  const { transformerNodes, transformerUnit } = await import('../src/data/transformer');
  const baseline = readJson<Baseline>(join(qualityDirectory, 'baseline.json'));
  const migration = readJson<Migration>(join(qualityDirectory, 'id-migration.json'));
  const issues = validateBaselineFiles(baseline, migration);
  const seenIds = new Set<string>();

  if (transformerNodes.length !== 25) {
    issues.push(issue('invalid-baseline', 'error', 'transformer', `运行时必须保留 25 个节点，当前为 ${transformerNodes.length}。`));
  }
  transformerNodes.forEach((node) => {
    if (node.exercises.length !== 12) {
      issues.push(issue('invalid-baseline', 'error', node.id, `每节点必须恰好 12 题，当前为 ${node.exercises.length}。`));
    }
    node.exercises.forEach((exercise) => {
      if (seenIds.has(exercise.id)) issues.push(issue('invalid-answer-structure', 'error', exercise.id, '题目 ID 在 Transformer 题库中重复。'));
      seenIds.add(exercise.id);
    });
    issues.push(...validateNodeQuality(node));
  });
  transformerUnit.sections.forEach((section) => issues.push(...validateSectionQuality(section.id, section.nodes)));
  if (seenIds.size !== 300) issues.push(issue('invalid-baseline', 'error', 'transformer', `运行时必须恰好包含 300 个唯一题目 ID，当前为 ${seenIds.size}。`));
  return issues;
}

export function runReviewValidation(): QuestionQualityIssue[] {
  return reviewFiles(join(qualityDirectory, 'reviews')).flatMap((path) => validateQuestionReviewRecord(readJson<unknown>(path), path));
}

function printAndExit(issues: QuestionQualityIssue[], label: string): void {
  const errors = issues.filter((item) => item.severity === 'error');
  const warnings = issues.filter((item) => item.severity === 'warning');
  const legacyWarnings = warnings.filter((item) => item.ruleId === 'legacy-question');
  if (legacyWarnings.length) {
    console.warn(`WARN [legacy-question] ${legacyWarnings.length} 道 v1 基线题仍待迁移；这些题不会被视为已通过新门禁。`);
  }
  warnings
    .filter((item) => item.ruleId !== 'legacy-question')
    .forEach((item) => console.warn(`WARN [${item.ruleId}] ${item.questionId}: ${item.reason}`));
  errors.forEach((item) => console.error(`ERROR [${item.ruleId}] ${item.questionId}: ${item.reason}`));
  console.log(`${label}: ${errors.length} error(s), ${warnings.length} warning(s).`);
  if (errors.length) process.exitCode = 1;
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  if (process.argv.includes('--reviews')) {
    printAndExit(runReviewValidation(), 'Question review validation');
  } else {
    void runQuestionValidation().then((issues) => printAndExit(issues, 'Question quality validation'));
  }
}
