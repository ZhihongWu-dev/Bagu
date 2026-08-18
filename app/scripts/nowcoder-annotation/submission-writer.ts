import type { SourceManifest } from '../nowcoder-intake/types';
import { atomicWrite } from './store';
import { buildAnnotationSubmission, serializeAnnotationSubmission, type AnnotationSubmission } from './submission';
import type { ManualAnnotationDataset } from './types';

export async function writeAnnotationSubmission(
  path: string,
  manifest: SourceManifest,
  dataset: ManualAnnotationDataset,
  now = new Date(),
): Promise<AnnotationSubmission> {
  const submission = buildAnnotationSubmission(manifest, dataset, now.toISOString());
  await atomicWrite(path, serializeAnnotationSubmission(submission));
  return submission;
}
