import { knowledgeCards } from '../src/data/knowledge-base';
import { allLearningNodes } from '../src/data/course-catalog';
import { applicationInterviewEvidence, applicationKnowledgeCards, applicationNodes, applicationUnit } from '../src/data/application/curriculum';
import { algorithmNodes, algorithmUnit, interviewEvidence } from '../src/data/specialist-curriculum';
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
check(algorithmNodes.length === 25, `Expected 25 algorithm nodes, received ${algorithmNodes.length}.`);
check(applicationNodes.length === 64, `Expected 64 application nodes, received ${applicationNodes.length}.`);
check(allLearningNodes.length === 114, `Expected 114 total nodes, received ${allLearningNodes.length}.`);
check(applicationKnowledgeCards.length >= 112, `Expected at least 112 application articles, received ${applicationKnowledgeCards.length}.`);

const nodeIds = new Set<string>();
const exerciseIds = new Set<string>();
const knowledgeIds = new Set(knowledgeCards.map((card) => card.id));
const transformerKnowledgeCount = knowledgeCards.filter((card) => card.domainId === 'transformer').length;
check(transformerKnowledgeCount >= 25, `Expected at least 25 Transformer knowledge articles, received ${transformerKnowledgeCount}.`);
knowledgeCards.forEach((card) => {
  check(!/[？?]/.test(card.title), `${card.id} must use a concept title instead of a question.`);
  check(Boolean(card.interviewQuestion?.trim()), `${card.id} must preserve an interview question.`);
  check(card.summary.trim().length >= 12, `${card.id} summary is too short for the concept manual.`);
});

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

[algorithmUnit].forEach((unit) => {
  check(unit.sections.length === 5, `${unit.id} must contain 5 sections.`);
  unit.sections.forEach((section) => {
    check(section.nodes.length === 5, `${section.id} must contain 5 nodes.`);
    section.nodes.forEach((node) => {
      check(!nodeIds.has(node.id), `Duplicate node id: ${node.id}.`);
      nodeIds.add(node.id);
      check(node.exercises.length === 12, `${node.id} must contain exactly 12 source exercises.`);
      check(node.exercises.filter((exercise) => exercise.type === 'self-recall').length === 2, `${node.id} must contain exactly two oral exercises.`);
      check(node.exercises.filter((exercise) => exercise.practiceKind === 'concept').length === 4, `${node.id} must contain four concept exercises.`);
      check(node.exercises.filter((exercise) => exercise.practiceKind === 'boundary').length === 3, `${node.id} must contain three boundary exercises.`);
      check(node.exercises.filter((exercise) => exercise.practiceKind === 'scenario').length === 3, `${node.id} must contain three scenario exercises.`);
      check(node.exercises.filter((exercise) => exercise.practiceKind === 'oral').length === 2, `${node.id} must contain two oral exercises.`);
      node.knowledgeIds.forEach((id) => check(knowledgeIds.has(id), `${node.id} references missing knowledge article ${id}.`));
      node.exercises.forEach((exercise) => validateExercise(exercise, node.id));
      const evidence = interviewEvidence.find((item) => item.nodeId === node.id);
      check(Boolean(evidence), `${node.id} is missing interview evidence.`);
      check((evidence?.sources.length ?? 0) >= 3, `${node.id} must include at least three interview evidence sources.`);
      node.knowledgeIds.forEach((id) => {
        const article = knowledgeCards.find((card) => card.id === id);
        check((article?.sources.length ?? 0) >= 1, `${node.id} must include a primary technical source.`);
      });
    });
  });
});

check(applicationUnit.sections.length === 8, 'Application unit must contain eight sections.');
applicationUnit.sections.forEach((section) => {
  check(section.nodes.length === 8, `${section.id} must contain eight nodes.`);
  section.nodes.forEach((node) => {
    check(!nodeIds.has(node.id), `Duplicate node id: ${node.id}.`);
    nodeIds.add(node.id);
    check(node.exercises.length === 24, `${node.id} must contain exactly 24 source exercises.`);
    const expectedKinds = { concept: 6, mechanism: 4, selection: 4, troubleshooting: 4, metrics: 3, oral: 3 };
    Object.entries(expectedKinds).forEach(([kind, count]) => check(node.exercises.filter((exercise) => exercise.practiceKind === kind).length === count, `${node.id} must contain ${count} ${kind} exercises.`));
    node.knowledgeIds.forEach((id) => check(knowledgeIds.has(id), `${node.id} references missing knowledge article ${id}.`));
    node.exercises.forEach((exercise) => validateExercise(exercise, node.id));
    const evidence = applicationInterviewEvidence.find((item) => item.nodeId === node.id);
    check((evidence?.sources.length ?? 0) >= 3, `${node.id} must include three interview sources.`);
  });
});

check(exerciseIds.size === 2136, `Expected exactly 2136 unique exercises, received ${exerciseIds.size}.`);
check(new Set(knowledgeCards.map((card) => card.id)).size === knowledgeCards.length, 'Knowledge article ids must be unique.');

if (failures.length) {
  console.error(`Course validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Course validation passed: 114 nodes, ${exerciseIds.size} exercises, ${knowledgeCards.length} knowledge articles.`);
