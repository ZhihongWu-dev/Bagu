export type KnowledgeKeyword = {
  id: string;
  label: string;
  definition: string;
  intuition: string;
  formula?: string;
};

export type Choice = {
  id: string;
  label: string;
};

type ExerciseBase = {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'ordering' | 'self-recall';
  eyebrow: string;
  prompt: string;
  formula?: string;
  explanation: string;
  coveredPoints: string[];
  missingPoint?: string;
  keywords: string[];
};

export type SingleChoiceExercise = ExerciseBase & {
  type: 'single-choice';
  choices: Choice[];
  correctChoiceId: string;
};

export type MultipleChoiceExercise = ExerciseBase & {
  type: 'multiple-choice';
  choices: Choice[];
  correctChoiceIds: string[];
};

export type OrderingExercise = ExerciseBase & {
  type: 'ordering';
  choices: Choice[];
  correctOrder: string[];
};

export type SelfRecallExercise = ExerciseBase & {
  type: 'self-recall';
  referencePoints: string[];
};

export type Exercise = SingleChoiceExercise | MultipleChoiceExercise | OrderingExercise | SelfRecallExercise;

export type LearningNode = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: string;
  duration: number;
  exercises: Exercise[];
  knowledgeIds: string[];
};

export type CourseSection = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  color: string;
  darkColor: string;
  softColor: string;
  nodes: LearningNode[];
};

export type CourseUnit = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  sections: CourseSection[];
};

export type KnowledgeDomainId =
  | 'transformer'
  | 'llm'
  | 'finetuning'
  | 'loss'
  | 'deep-learning'
  | 'reinforcement-learning';

export type KnowledgeDomain = {
  id: KnowledgeDomainId;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  softColor: string;
};

export type KnowledgeSource = {
  title: string;
  url: string;
  kind: 'paper' | 'docs' | 'course';
};

export type KnowledgeCard = {
  id: string;
  domainId: KnowledgeDomainId;
  title: string;
  aliases: string[];
  difficulty: '基础' | '进阶' | '高频';
  summary: string;
  answer: string;
  intuition: string;
  formula?: string;
  keyPoints: string[];
  followUps: string[];
  sources: KnowledgeSource[];
  misconceptions?: string[];
  relatedIds?: string[];
  comparison?: { label: string; value: string }[];
};

export type ReviewSource = 'lesson' | 'knowledge' | 'project';

export type ReviewQueueItem = {
  id: string;
  source: ReviewSource;
  targetId: string;
  dueAt: string;
};

export type ResumeFileMeta = {
  name: string;
  size?: number;
  selectedAt: string;
};

export type ProjectProfile = {
  name: string;
  role: string;
  summary: string;
  stack: string[];
  challenge: string;
};
