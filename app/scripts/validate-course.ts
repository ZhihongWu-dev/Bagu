import { knowledgeCards } from '../src/data/knowledge-base';
import { keywords, transformerNodes, transformerUnit } from '../src/data/transformer';
import type { Exercise } from '../src/types/course';
import { appendWrongReview, buildPracticeSession, getPracticeProgress } from '../src/utils/practice-session';

const failures: string[] = [];
const check = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

check(transformerUnit.id === 'transformer', 'Transformer must be the course Unit.');
check(transformerUnit.sections.length === 5, `Expected 5 Sections, received ${transformerUnit.sections.length}.`);
check(transformerNodes.length === 25, `Expected 25 learning nodes, received ${transformerNodes.length}.`);

const nodeIds = new Set<string>();
const exerciseIds = new Set<string>();
const knowledgeIds = new Set(knowledgeCards.map((card) => card.id));
const transformerKnowledgeCount = knowledgeCards.filter((card) => card.domainId === 'transformer').length;
check(transformerKnowledgeCount >= 25, `Expected at least 25 Transformer knowledge articles, received ${transformerKnowledgeCount}.`);

function validateExercise(exercise: Exercise, nodeId: string) {
  check(!exerciseIds.has(exercise.id), `Duplicate exercise id: ${exercise.id}.`);
  exerciseIds.add(exercise.id);
  check(exercise.prompt.trim().length >= 10, `${exercise.id} prompt is too short.`);
  check(exercise.explanation.trim().length >= 20, `${exercise.id} explanation is too short.`);
  exercise.keywords.forEach((keywordId) => check(Boolean(keywords[keywordId]), `${exercise.id} references missing keyword ${keywordId}.`));

  if (exercise.type === 'single-choice') {
    check(exercise.choices.length === 4, `${exercise.id} must have four choices.`);
    check(exercise.choices.some((choice) => choice.id === exercise.correctChoiceId), `${exercise.id} has an invalid correct choice.`);
  } else if (exercise.type === 'multiple-choice') {
    check(exercise.correctChoiceIds.length >= 2, `${exercise.id} should have at least two correct choices.`);
    exercise.correctChoiceIds.forEach((id) => check(exercise.choices.some((choice) => choice.id === id), `${exercise.id} has invalid correct choice ${id}.`));
  } else if (exercise.type === 'ordering') {
    check(exercise.correctOrder.length === exercise.choices.length, `${exercise.id} ordering answer length is invalid.`);
    check(new Set(exercise.correctOrder).size === exercise.choices.length, `${exercise.id} ordering answer contains duplicates.`);
  } else {
    check(exercise.referencePoints.length >= 3, `${exercise.id} needs at least three recall points.`);
  }

  check(exercise.id.startsWith(nodeId), `${exercise.id} should be namespaced by node ${nodeId}.`);
}

transformerUnit.sections.forEach((section) => {
  check(section.nodes.length === 5, `${section.id} must contain 5 nodes.`);
  section.nodes.forEach((node) => {
    check(!nodeIds.has(node.id), `Duplicate node id: ${node.id}.`);
    nodeIds.add(node.id);
    check(node.exercises.length >= 12, `${node.id} must contain at least 12 exercises.`);
    check(node.exercises.filter((exercise) => exercise.type !== 'self-recall').length >= 8, `${node.id} needs at least 8 objective questions.`);
    check(node.exercises.some((exercise) => exercise.type === 'self-recall'), `${node.id} needs a self-recall question.`);
    node.knowledgeIds.forEach((id) => check(knowledgeIds.has(id), `${node.id} references missing knowledge article ${id}.`));
    node.exercises.forEach((exercise) => validateExercise(exercise, node.id));

    const first = buildPracticeSession(node, 0);
    const second = buildPracticeSession(node, 1);
    check(first.length === 8, `${node.id} first session must contain 8 base questions.`);
    check(second.length === 8, `${node.id} second session must contain 8 base questions.`);
    check(first.map((item) => item.exercise.id).join('|') !== second.map((item) => item.exercise.id).join('|'), `${node.id} attempt seed should rotate questions.`);

    const withReview = appendWrongReview(first, first[0]);
    check(withReview.length === 9, `${node.id} wrong answer must append one review.`);
    check(appendWrongReview(withReview, withReview[8]).length === 9, `${node.id} review question must not append forever.`);
    let previous = 0;
    for (let completed = 1; completed <= withReview.length; completed += 1) {
      const progress = getPracticeProgress(completed, withReview.length);
      check(progress >= previous, `${node.id} progress must be monotonic.`);
      previous = progress;
    }
    check(previous === 1, `${node.id} final progress must equal 100%.`);
  });
});

check(exerciseIds.size === 300, `Expected exactly 300 unique exercises, received ${exerciseIds.size}.`);
check(new Set(knowledgeCards.map((card) => card.id)).size === knowledgeCards.length, 'Knowledge article ids must be unique.');

if (failures.length) {
  console.error(`Course validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Course validation passed: ${transformerUnit.sections.length} Sections, ${transformerNodes.length} nodes, ${exerciseIds.size} exercises, ${transformerKnowledgeCount} Transformer knowledge articles.`);
