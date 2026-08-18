import type {
  Choice,
  Exercise,
  LearningNode,
  MultipleChoiceExercise,
  MathExpression,
  OrderingExercise,
  SelfRecallExercise,
  SingleChoiceExercise,
} from '@/types/course';
import { toMathExpression } from '@/data/math-expression';
import type { AppIconName } from '@/types/icons';

export type NodeBlueprint = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: AppIconName;
  knowledgeIds: string[];
  core: string;
  facts: [string, string, string];
  traps: [string, string, string];
  sequence: [string, string, string, string];
  interview: [string, string, string];
  scenario: string;
  scenarioAnswer: string;
  boundary: string;
  comparison: string;
  formula?: string;
  keywords?: string[];
  specialist?: boolean;
};

type Shared = {
  id: string;
  eyebrow: string;
  prompt: string;
  explanation: string;
  coveredPoints: string[];
  missingPoint?: string;
  keywords?: string[];
  formula?: MathExpression;
};

const choiceIds = ['a', 'b', 'c', 'd'];
const makeChoices = (labels: (string | ReturnType<typeof toMathExpression>)[]): Choice[] => labels.map((value, index) => typeof value === 'string'
  ? { id: choiceIds[index], label: value }
  : { id: choiceIds[index], label: value.plainText, formula: value });

function single(shared: Shared, labels: (string | ReturnType<typeof toMathExpression>)[], correctIndex: number): SingleChoiceExercise {
  return {
    ...shared,
    type: 'single-choice',
    keywords: shared.keywords ?? [],
    choices: makeChoices(labels),
    correctChoiceId: choiceIds[correctIndex],
  };
}

function multi(shared: Shared, labels: (string | ReturnType<typeof toMathExpression>)[], correctIndexes: number[]): MultipleChoiceExercise {
  return {
    ...shared,
    type: 'multiple-choice',
    keywords: shared.keywords ?? [],
    choices: makeChoices(labels),
    correctChoiceIds: correctIndexes.map((index) => choiceIds[index]),
  };
}

function order(shared: Shared, steps: string[], variant = 0): OrderingExercise {
  const permutations = [[2, 0, 3, 1], [1, 3, 0, 2]];
  const displayOrder = permutations[variant % permutations.length];
  const choices = displayOrder.map((stepIndex, index) => ({ id: choiceIds[index], label: steps[stepIndex] }));
  const correctOrder = steps.map((step) => choices.find((choice) => choice.label === step)!.id);
  return { ...shared, type: 'ordering', keywords: shared.keywords ?? [], choices, correctOrder };
}

function recall(shared: Shared, referencePoints: string[]): SelfRecallExercise {
  return { ...shared, type: 'self-recall', keywords: shared.keywords ?? [], referencePoints };
}

export function buildNode(blueprint: NodeBlueprint): LearningNode {
  const { facts, traps, interview, sequence } = blueprint;
  const explanation = `${blueprint.core} ${blueprint.boundary}`;
  const keywords = blueprint.keywords ?? [];
  const formula = blueprint.formula ? toMathExpression(blueprint.formula) : undefined;
  const exercises: Exercise[] = [
    single(
      { id: `${blueprint.id}-01`, eyebrow: '核心判断', prompt: `关于“${blueprint.shortTitle}”，哪句话最准确？`, explanation, coveredPoints: facts, keywords, formula },
      [blueprint.core, ...traps],
      0,
    ),
    multi(
      { id: `${blueprint.id}-02`, eyebrow: '多选 · 机制', prompt: `理解“${blueprint.shortTitle}”必须抓住哪些机制？`, explanation, coveredPoints: facts, keywords },
      [facts[0], traps[0], facts[1], facts[2]],
      [0, 2, 3],
    ),
    order(
      { id: `${blueprint.id}-03`, eyebrow: '排序 · 流程', prompt: `按“${blueprint.shortTitle}”的计算或推理顺序排列。`, explanation, coveredPoints: sequence, keywords },
      sequence,
    ),
    recall(
      { id: `${blueprint.id}-04`, eyebrow: '口述 · 30 秒', prompt: `不用术语堆砌，向面试官解释“${blueprint.title}”。`, explanation, coveredPoints: interview, keywords },
      interview,
    ),
    single(
      { id: `${blueprint.id}-05`, eyebrow: '场景题', prompt: blueprint.scenario, explanation: `${blueprint.scenarioAnswer} ${blueprint.boundary}`, coveredPoints: [blueprint.scenarioAnswer, blueprint.boundary], keywords },
      [traps[1], blueprint.scenarioAnswer, traps[2], traps[0]],
      1,
    ),
    multi(
      { id: `${blueprint.id}-06`, eyebrow: '多选 · 面试表达', prompt: `回答“${blueprint.shortTitle}”时，哪些内容应该主动讲清楚？`, explanation, coveredPoints: interview, keywords },
      [interview[0], interview[1], traps[2], interview[2]],
      [0, 1, 3],
    ),
    single(
      { id: `${blueprint.id}-07`, eyebrow: blueprint.formula ? '公式理解' : '边界判断', prompt: blueprint.formula ? `哪一项最能对应“${blueprint.shortTitle}”的公式或计算关系？` : `“${blueprint.shortTitle}”最需要补充哪项边界条件？`, explanation, coveredPoints: [blueprint.boundary], keywords, formula },
      [traps[0], traps[1], formula ?? blueprint.boundary, traps[2]],
      2,
    ),
    blueprint.specialist
      ? single(
        { id: `${blueprint.id}-08`, eyebrow: '对比 · 取舍', prompt: `关于这项工程对比，哪项表述最完整：${blueprint.comparison}`, explanation, coveredPoints: [blueprint.comparison, ...facts.slice(0, 2)], keywords },
        [traps[0], traps[1], blueprint.comparison, traps[2]],
        2,
      )
      : recall(
        { id: `${blueprint.id}-08`, eyebrow: '口述 · 对比', prompt: `解释这项对比，并说明它为何重要：${blueprint.comparison}`, explanation, coveredPoints: [blueprint.comparison, ...facts.slice(0, 2)], keywords },
        [blueprint.comparison, facts[0], facts[1]],
      ),
    single(
      { id: `${blueprint.id}-09`, eyebrow: '纠错题', prompt: `下面哪句话是关于“${blueprint.shortTitle}”的常见误区？`, explanation: `误区是：${traps[0]}。${blueprint.core}`, coveredPoints: [traps[0], blueprint.core], keywords },
      [facts[0], facts[1], traps[0], blueprint.boundary],
      2,
    ),
    multi(
      { id: `${blueprint.id}-10`, eyebrow: '多选 · 边界', prompt: `哪些说法既正确又没有忽略“${blueprint.shortTitle}”的边界？`, explanation, coveredPoints: [facts[0], facts[2], blueprint.boundary], keywords },
      [facts[0], traps[1], facts[2], blueprint.boundary],
      [0, 2, 3],
    ),
    order(
      { id: `${blueprint.id}-11`, eyebrow: '排序 · 白板推导', prompt: `白板讲解“${blueprint.shortTitle}”时，怎样组织步骤最清楚？`, explanation, coveredPoints: sequence, keywords },
      sequence,
      1,
    ),
    recall(
      { id: `${blueprint.id}-12`, eyebrow: '追问 · 深挖', prompt: `面试官继续追问“${blueprint.boundary}”，请给出完整回答。`, explanation, coveredPoints: [blueprint.boundary, ...interview], keywords },
      [blueprint.boundary, ...interview],
    ),
  ];

  const specialistKinds = ['concept', 'concept', 'concept', 'oral', 'scenario', 'scenario', 'boundary', 'boundary', 'concept', 'boundary', 'scenario', 'oral'] as const;
  const categorizedExercises: Exercise[] = blueprint.specialist
    ? exercises.map((exercise, index) => ({ ...exercise, practiceKind: specialistKinds[index] }))
    : exercises;

  return {
    id: blueprint.id,
    title: blueprint.title,
    shortTitle: blueprint.shortTitle,
    subtitle: blueprint.subtitle,
    icon: blueprint.icon,
    duration: 10,
    exercises: categorizedExercises,
    knowledgeIds: blueprint.knowledgeIds,
  };
}
