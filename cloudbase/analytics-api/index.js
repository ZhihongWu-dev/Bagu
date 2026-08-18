'use strict';

const crypto = require('node:crypto');
const http = require('node:http');

const { aggregateEvents } = require('./aggregate');
const repository = require('./repository');
const { validateBatch } = require('./protocol');

const PORT = 9000;
const MAX_BODY_BYTES = 256 * 1024;
const rateBuckets = new Map();

const server = http.createServer(async (request, response) => {
  setCors(response);
  if (request.method === 'OPTIONS') return send(response, 204, null);
  try {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/health') return send(response, 200, { status: 'healthy', version: '1.0.0' });
    if (request.method === 'POST' && url.pathname === '/v1/installations') return createInstallation(response);
    if (request.method === 'POST' && url.pathname === '/v1/events') return receiveEvents(request, response);
    if (request.method === 'DELETE' && url.pathname === '/v1/installations/current') return deleteInstallation(request, response);
    if (request.method === 'GET' && url.pathname === '/v1/admin/summary') return adminSummary(request, response, url);
    if (request.method === 'POST' && url.pathname === '/v1/admin/cleanup') return cleanup(request, response);
    return send(response, 404, { error: 'not_found' });
  } catch (error) {
    if (error?.message === 'body_too_large') return send(response, 413, { error: 'body_too_large' });
    if (error?.message === 'invalid_json') return send(response, 400, { error: 'invalid_json' });
    return send(response, 500, { error: 'internal_error' });
  }
});

async function createInstallation(response) {
  if (!takeRateLimit('installation-global', 60, 60_000)) return send(response, 429, { error: 'rate_limited' });
  const identity = await repository.createInstallation();
  return send(response, 201, identity);
}

async function receiveEvents(request, response) {
  const identity = readIdentity(request);
  if (!identity || !takeRateLimit(`events:${identity.installationId}`, 120, 60_000)) return send(response, identity ? 429 : 401, { error: identity ? 'rate_limited' : 'unauthorized' });
  if (!await repository.authenticate(identity.installationId, identity.writeToken)) return send(response, 401, { error: 'unauthorized' });
  const body = await readJson(request);
  const events = validateBatch(body);
  if (!events) return send(response, 422, { error: 'invalid_events' });
  const accepted = await repository.saveEvents(identity.installationId, events, new Date().toISOString());
  return send(response, 200, { accepted_event_ids: accepted });
}

async function deleteInstallation(request, response) {
  const identity = readIdentity(request);
  if (!identity) return send(response, 401, { error: 'unauthorized' });
  const deleted = await repository.deleteInstallation(identity.installationId, identity.writeToken);
  return deleted ? send(response, 204, null) : send(response, 401, { error: 'unauthorized' });
}

async function adminSummary(request, response, url) {
  if (!isAdmin(request)) return send(response, 401, { error: 'unauthorized' });
  const to = validDate(url.searchParams.get('to')) ?? new Date().toISOString();
  const from = validDate(url.searchParams.get('from')) ?? new Date(Date.parse(to) - 30 * 24 * 60 * 60 * 1000).toISOString();
  if (Date.parse(from) > Date.parse(to)) return send(response, 400, { error: 'invalid_date_range' });
  const platform = ['android', 'ios', 'web'].includes(url.searchParams.get('platform')) ? url.searchParams.get('platform') : null;
  const appVersion = /^[A-Za-z0-9._-]{1,30}$/.test(url.searchParams.get('app_version') ?? '') ? url.searchParams.get('app_version') : null;
  const events = await repository.queryEvents({ from, to, platform, app_version: appVersion });
  return send(response, 200, aggregateEvents(events));
}

async function cleanup(request, response) {
  if (!isAdmin(request)) return send(response, 401, { error: 'unauthorized' });
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const deleted = await repository.cleanupEvents(cutoff);
  return send(response, 200, { deleted, cutoff });
}

function readIdentity(request) {
  const installationId = request.headers['x-bagu-installation'];
  const authorization = request.headers.authorization;
  if (typeof installationId !== 'string' || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return null;
  return { installationId, writeToken: authorization.slice(7) };
}

function isAdmin(request) {
  const configured = process.env.ANALYTICS_ADMIN_TOKEN;
  const provided = request.headers.authorization?.slice(7);
  if (!configured || !provided || configured.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(configured), Buffer.from(provided));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
      } else if (!tooLarge) chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) return reject(new Error('body_too_large'));
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('invalid_json')); }
    });
    request.on('error', reject);
  });
}

function takeRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function validDate(value) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
}

function setCors(response) {
  response.setHeader('Access-Control-Allow-Origin', process.env.ANALYTICS_ALLOWED_ORIGIN ?? '*');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Bagu-Installation');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.setHeader('Cache-Control', 'no-store');
}

function send(response, statusCode, body) {
  response.statusCode = statusCode;
  if (body === null) return response.end();
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.end(JSON.stringify(body));
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bagu analytics API listening on ${PORT}`);
});
