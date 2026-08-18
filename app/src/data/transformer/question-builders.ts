import type {
  Choice,
  Exercise,
  LearningNode,
  MultipleChoiceExercise,
  OrderingExercise,
  SelfRecallExercise,
  SingleChoiceExercise,
} from '@/types/course';
import type { AppIconName } from '@/types/icons';
import type { QuestionCognitiveLevel } from '@/types/question-quality';

type QuestionShared = {
  id: string;
  cognitiveLevel: QuestionCognitiveLevel;
  learningObjectiveId: string;
  eyebrow: string;
  prompt: string;
  explanation: string;
  coveredPoints: string[];
  missingPoint?: string;
  keywords?: string[];
  practiceKind?: Exercise['practiceKind'];
};

type ChoiceInput = string | Choice;

const normalizeChoices = (choices: ChoiceInput[]): Choice[] => choices.map((choice, index) => (
  typeof choice === 'string' ? { id: String.fromCharCode(97 + index), label: choice } : choice
));

const optionId = (index: number) => String.fromCharCode(97 + index);

function rotateAndReidentify(choices: Choice[], questionId: string, extraShift = 0) {
  // Offsets balance Section 1 answer slots while keeping snapshots deterministic.
  const nodeOffsets: Record<string, number> = {
    'qkv-roles': 2,
    'attention-shapes': 2,
    'scaled-dot-product': 3,
    'softmax-attention': 2,
    'attention-masks': 0,
  };
  const match = questionId.match(/^(.*)-(\d{2})$/);
  const nodeId = match?.[1] ?? questionId;
  const questionNumber = Number(match?.[2] ?? 0);
  const shift = (questionNumber + (nodeOffsets[nodeId] ?? 0) + extraShift) % choices.length;
  const rotated = choices.map((_, index) => choices[(index + shift) % choices.length]);
  const idMap = new Map<string, string>();
  const displayedChoices = rotated.map((choice, index) => {
    const id = optionId(index);
    idMap.set(choice.id, id);
    return { ...choice, id };
  });

  return { displayedChoices, idMap };
}

const withVersion = <T extends QuestionShared>(question: T) => ({
  ...question,
  questionVersion: 2,
  keywords: question.keywords ?? [],
});

export const singleQuestion = (
  question: QuestionShared & { choices: ChoiceInput[]; correctChoiceId: string },
): SingleChoiceExercise => {
  const { displayedChoices, idMap } = rotateAndReidentify(normalizeChoices(question.choices), question.id);
  return {
    ...withVersion(question),
    type: 'single-choice',
    choices: displayedChoices,
    correctChoiceId: idMap.get(question.correctChoiceId)!,
  };
};

export const multipleQuestion = (
  question: QuestionShared & { choices: ChoiceInput[]; correctChoiceIds: string[] },
): MultipleChoiceExercise => {
  const { displayedChoices, idMap } = rotateAndReidentify(normalizeChoices(question.choices), question.id);
  return {
    ...withVersion(question),
    type: 'multiple-choice',
    choices: displayedChoices,
    correctChoiceIds: question.correctChoiceIds.map((id) => idMap.get(id)!),
  };
};

export const orderingQuestion = (
  question: QuestionShared & { choices: ChoiceInput[]; correctOrder: string[] },
): OrderingExercise => {
  const normalizedChoices = normalizeChoices(question.choices);
  let { displayedChoices, idMap } = rotateAndReidentify(normalizedChoices, question.id);
  let correctOrder = question.correctOrder.map((id) => idMap.get(id)!);
  if (correctOrder.every((id, index) => id === displayedChoices[index].id)) {
    ({ displayedChoices, idMap } = rotateAndReidentify(normalizedChoices, question.id, 1));
    correctOrder = question.correctOrder.map((id) => idMap.get(id)!);
  }
  return {
    ...withVersion(question),
    type: 'ordering',
    choices: displayedChoices,
    correctOrder,
  };
};

export const recallQuestion = (
  question: QuestionShared & { referencePoints: string[] },
): SelfRecallExercise => ({
  ...withVersion(question),
  type: 'self-recall',
});

export type ExplicitQuestionNode = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: AppIconName;
  knowledgeIds: string[];
  exercises: Exercise[];
};

export function buildExplicitQuestionNode(node: ExplicitQuestionNode): LearningNode {
  if (node.exercises.length !== 12) {
    throw new Error(`${node.id} must define exactly 12 exercises.`);
  }

  return {
    ...node,
    duration: 10,
  };
}
