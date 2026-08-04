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

