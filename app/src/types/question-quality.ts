export type QuestionCognitiveLevel = 'foundation' | 'application' | 'deep';

export type QuestionReviewVerdict = 'pass' | 'revise' | 'reject' | 'uncalibrated';

export type QuestionSourceReference = {
  title: string;
  url: string;
  locator?: string;
};

export type QuestionQualityScore = {
  factualCorrectness: number;
  answerUniqueness: number;
  promptClarity: number;
  distractorQuality: number;
  explanationQuality: number;
  difficultyFit: number;
};
