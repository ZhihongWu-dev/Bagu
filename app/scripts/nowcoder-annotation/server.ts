import { createServer, type Server } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifest } from '../nowcoder-intake/manifest';
import { createRequestHandler } from './routes';
import { AnnotationStore } from './store';

export interface AnnotationServerOptions {
  manifestPath?: string;
  dataPath?: string;
  exportRoot?: string;
  uiRoot?: string;
  port?: number;
  now?: () => Date;
}

export interface RunningAnnotationServer {
  server: Server;
  url: string;
  close: () => Promise<void>;
}

const MODULE_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));

export async function startAnnotationServer(options: AnnotationServerOptions = {}): Promise<RunningAnnotationServer> {
  const manifestPath = resolve(options.manifestPath ?? 'quality/nowcoder-intake/manifests/pilot-100.json');
  const dataPath = resolve(options.dataPath ?? 'quality/nowcoder-intake/manual-data/annotations.json');
  const exportRoot = resolve(options.exportRoot ?? 'quality/nowcoder-intake/manual-data/exports');
  const uiRoot = resolve(options.uiRoot ?? resolve(MODULE_ROOT, 'ui'));
  const manifest = await loadManifest(manifestPath);
  const store = new AnnotationStore(dataPath, manifest);
  await store.load();
  const server = createServer(createRequestHandler({ manifest, store, exportRoot, uiRoot, now: options.now }));
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 4178, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolveListen();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('annotation_server_address_unavailable');
  const close = async () => {
    await store.idle();
    await new Promise<void>((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
  };
  return { server, url: `http://127.0.0.1:${address.port}`, close };
}

function parsePort(argv: string[]): number {
  const assigned = argv.find((argument) => argument.startsWith('port=') || argument.startsWith('--port='));
  const value = assigned ? assigned.slice(assigned.indexOf('=') + 1) : '4178';
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65_535) throw new Error('port must be an integer from 1024 to 65535');
  return port;
}

async function main(): Promise<void> {
  const running = await startAnnotationServer({ port: parsePort(process.argv.slice(2)) });
  console.log(`Bagu manual annotation module: ${running.url}`);
  console.log('Press Ctrl+C to stop. No external pages are fetched by this service.');
  const stop = async () => {
    process.removeListener('SIGINT', stop);
    await running.close();
  };
  process.on('SIGINT', stop);
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
