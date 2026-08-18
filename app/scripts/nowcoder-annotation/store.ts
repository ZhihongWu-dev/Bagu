import { mkdir, open, readFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { SourceManifest, SourceManifestEntry } from '../nowcoder-intake/types';
import type { ManualAnnotation, ManualAnnotationDataset } from './types';
import { emptyDataset, validateAnnotation, validateDataset } from './validation';

async function atomicWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  const handle = await open(temporary, 'wx');
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, path);
}

export class AnnotationStore {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly path: string, private readonly manifest: SourceManifest) {}

  async load(): Promise<ManualAnnotationDataset> {
    try {
      return validateDataset(JSON.parse(await readFile(this.path, 'utf8')), this.manifest);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyDataset(this.manifest);
      throw error;
    }
  }

  async save(source: SourceManifestEntry, value: unknown): Promise<ManualAnnotationDataset> {
    const annotation = validateAnnotation(value, source);
    let result!: ManualAnnotationDataset;
    const operation = async () => {
      const dataset = await this.load();
      dataset.annotations[source.sourceId] = annotation;
      const ordered: Record<string, ManualAnnotation> = {};
      for (const candidate of this.manifest.sources) {
        const existing = dataset.annotations[candidate.sourceId];
        if (existing) ordered[candidate.sourceId] = existing;
      }
      result = { ...dataset, annotations: ordered };
      await atomicWrite(this.path, JSON.stringify(result, null, 2) + '\n');
    };
    const queued = this.writeQueue.then(operation, operation);
    this.writeQueue = queued.then(() => undefined, () => undefined);
    await queued;
    return result;
  }

  async idle(): Promise<void> {
    await this.writeQueue;
  }
}

export { atomicWrite };
