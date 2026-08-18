import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { SourceManifest } from '../nowcoder-intake/types';
import { buildAnnotationReport, buildTopicSummary } from './aggregate';
import { annotationsToCsv } from './csv';
import { atomicWrite } from './store';
import type { ManualAnnotationDataset } from './types';

function exportStamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

export async function exportAnnotations(root: string, manifest: SourceManifest, dataset: ManualAnnotationDataset, now = new Date()): Promise<string> {
  const directory = join(root, exportStamp(now));
  const generatedAt = now.toISOString();
  await mkdir(root, { recursive: true });
  await mkdir(directory, { recursive: false });
  await Promise.all([
    atomicWrite(join(directory, 'annotations.json'), JSON.stringify(dataset, null, 2) + '\n'),
    atomicWrite(join(directory, 'annotations.csv'), annotationsToCsv(manifest, dataset)),
    atomicWrite(join(directory, 'topic-summary.json'), JSON.stringify(buildTopicSummary(manifest, dataset, generatedAt), null, 2) + '\n'),
    atomicWrite(join(directory, 'annotation-report.json'), JSON.stringify(buildAnnotationReport(manifest, dataset, generatedAt), null, 2) + '\n'),
  ]);
  return directory;
}
