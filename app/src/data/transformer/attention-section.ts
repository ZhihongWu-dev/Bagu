import type { CourseSection } from '@/types/course';

import { attentionMasksNode } from './questions/attention/attention-masks';
import { attentionShapesNode } from './questions/attention/attention-shapes';
import { qkvRolesNode } from './questions/attention/qkv-roles';
import { scaledDotProductNode } from './questions/attention/scaled-dot-product';
import { softmaxAttentionNode } from './questions/attention/softmax-attention';

export const attentionSection: CourseSection = {
  id: 'attention-foundations',
  title: 'Section 1 · QKV 与注意力计算',
  shortTitle: 'QKV 与 Attention',
  description: '从角色、形状到缩放、Softmax 和 Mask',
  color: '#6C52E5',
  darkColor: '#5138BD',
  softColor: '#EEE9FF',
  nodes: [qkvRolesNode, attentionShapesNode, scaledDotProductNode, softmaxAttentionNode, attentionMasksNode],
};
