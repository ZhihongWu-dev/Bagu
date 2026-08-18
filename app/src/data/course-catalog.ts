import { applicationNodes, applicationUnit } from '@/data/application/curriculum';
import { algorithmNodes, algorithmUnit } from '@/data/specialist-curriculum';
import { transformerNodes, transformerUnit } from '@/data/transformer-course';
import type { CourseUnit, LearningNode, TargetRole } from '@/types/course';

export const allLearningNodes = [...transformerNodes, ...algorithmNodes, ...applicationNodes];

export function getSpecialistUnit(role: TargetRole): CourseUnit {
  return role === 'llm_algorithm' ? algorithmUnit : applicationUnit;
}

export function getLearningUnits(role: TargetRole): CourseUnit[] {
  return [transformerUnit, getSpecialistUnit(role)];
}

export function getLessonOrder(role: TargetRole): string[] {
  const specialist = role === 'llm_algorithm' ? algorithmNodes : applicationNodes;
  return [...transformerNodes, ...specialist].map((node) => node.id);
}

export function findLearningNode(id: string | undefined): LearningNode | undefined {
  return allLearningNodes.find((node) => node.id === id);
}
