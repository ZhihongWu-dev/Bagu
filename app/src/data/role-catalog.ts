import type { AppIconName } from '@/types/icons';
import type { TargetRole } from '@/types/course';

export type RoleDefinition = {
  id: TargetRole;
  title: string;
  shortTitle: string;
  description: string;
  icon: AppIconName;
  color: string;
  darkColor: string;
  softColor: string;
};

export const roleCatalog: RoleDefinition[] = [
  {
    id: 'llm_algorithm',
    title: '大模型算法工程师',
    shortTitle: '算法工程师',
    description: '模型训练、对齐、架构与推理优化',
    icon: 'network',
    color: '#6C52E5',
    darkColor: '#5138BD',
    softColor: '#EEE9FF',
  },
  {
    id: 'llm_application',
    title: '大模型应用工程师',
    shortTitle: '应用工程师',
    description: 'RAG、Agent、评测与生产工程',
    icon: 'branch',
    color: '#25B995',
    darkColor: '#16856B',
    softColor: '#E7FAF4',
  },
];

export const roleById = Object.fromEntries(roleCatalog.map((role) => [role.id, role])) as Record<TargetRole, RoleDefinition>;

export function isTargetRole(value: unknown): value is TargetRole {
  return value === 'llm_algorithm' || value === 'llm_application';
}
