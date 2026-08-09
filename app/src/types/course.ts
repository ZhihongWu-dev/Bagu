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

export type Exercise = {
  id: string;
  eyebrow: string;
  prompt: string;
  formula?: string;
  choices: Choice[];
  correctChoiceId: string;
  explanation: string;
  coveredPoints: string[];
  missingPoint?: string;
  keywords: string[];
};

export type Lesson = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: string;
  duration: number;
  exercises: Exercise[];
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
