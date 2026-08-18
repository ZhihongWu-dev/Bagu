import type { IncomingMessage, ServerResponse } from 'node:http';

export const MAX_REQUEST_BYTES = 32_768;

export function expectedOrigin(request: IncomingMessage): string {
  const port = request.socket.localPort;
  return `http://127.0.0.1:${port}`;
}

export function validateRequestOrigin(request: IncomingMessage, writeRequest: boolean): void {
  const origin = expectedOrigin(request);
  if (request.headers.host !== origin.slice('http://'.length)) throw new Error('invalid_host');
  const suppliedOrigin = request.headers.origin;
  if ((writeRequest && suppliedOrigin !== origin) || (!writeRequest && suppliedOrigin && suppliedOrigin !== origin)) throw new Error('invalid_origin');
}

export function applySecurityHeaders(response: ServerResponse): void {
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Cache-Control', 'no-store');
}

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  if (!String(request.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) throw new Error('content_type_must_be_json');
  const declaredLength = Number(request.headers['content-length'] ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) throw new Error('request_too_large');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_REQUEST_BYTES) throw new Error('request_too_large');
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('invalid_json');
  }
}
