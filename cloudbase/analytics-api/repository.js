'use strict';

const crypto = require('node:crypto');

let database;

function getDatabase() {
  if (database) return database;
  const cloudbase = require('@cloudbase/js-sdk');
  const config = process.env.CLOUDBASE_ENV_ID
    ? { env: process.env.CLOUDBASE_ENV_ID }
    : {};
  database = cloudbase.init(config).database();
  return database;
}

const INSTALLATIONS = 'analytics_installations';
const EVENTS = 'analytics_events';
const DELETION_RECEIPTS = 'analytics_deletion_receipts';

async function createInstallation() {
  const db = getDatabase();
  const installationId = crypto.randomUUID();
  const writeToken = crypto.randomBytes(32).toString('base64url');
  await db.collection(INSTALLATIONS).doc(installationId).set({ data: {
    installation_id: installationId,
    token_hash: hash(writeToken),
    created_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  } });
  return { installation_id: installationId, write_token: writeToken };
}

async function authenticate(installationId, writeToken) {
  if (!installationId || !writeToken) return false;
  const db = getDatabase();
  const result = await db.collection(INSTALLATIONS).doc(installationId).get();
  const record = result.data?.[0];
  return record ? safeEqual(record.token_hash, hash(writeToken)) : false;
}

async function saveEvents(installationId, events, receivedAt) {
  const db = getDatabase();
  for (const event of events) {
    const documentId = hash(`${installationId}:${event.event_id}`);
    const document = db.collection(EVENTS).doc(documentId);
    const existing = await document.get();
    if (!existing.data?.[0]) {
      await document.set({ data: {
        ...event,
        installation_id: installationId,
        received_at: receivedAt,
      } });
    }
  }
  await db.collection(INSTALLATIONS).doc(installationId).update({ last_seen_at: receivedAt });
  return events.map((event) => event.event_id);
}

async function deleteInstallation(installationId, writeToken) {
  const db = getDatabase();
  const authenticated = await authenticate(installationId, writeToken);
  if (!authenticated) {
    const receipt = await db.collection(DELETION_RECEIPTS).doc(hash(writeToken)).get();
    return receipt.data?.[0]?.installation_id === installationId;
  }
  await deleteWhere(EVENTS, { installation_id: installationId });
  await db.collection(INSTALLATIONS).doc(installationId).remove();
  await db.collection(DELETION_RECEIPTS).doc(hash(writeToken)).set({ data: {
    installation_id: installationId,
    deleted_at: new Date().toISOString(),
  } });
  return true;
}

async function queryEvents(filters) {
  const db = getDatabase();
  const command = db.command;
  let query = db.collection(EVENTS).where({
    received_at: command.gte(filters.from).and(command.lte(filters.to)),
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.app_version ? { app_version: filters.app_version } : {}),
  });
  const events = [];
  for (let offset = 0; offset < 10_000; offset += 100) {
    const result = await query.skip(offset).limit(100).get();
    events.push(...result.data);
    if (result.data.length < 100) break;
  }
  return events;
}

async function cleanupEvents(cutoff) {
  const db = getDatabase();
  const command = db.command;
  const events = await deleteWhere(EVENTS, { received_at: command.lt(cutoff) });
  const installations = await deleteWhere(INSTALLATIONS, { last_seen_at: command.lt(cutoff) });
  const receiptCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const deletionReceipts = await deleteWhere(DELETION_RECEIPTS, { deleted_at: command.lt(receiptCutoff) });
  return { events, installations, deletion_receipts: deletionReceipts };
}

async function deleteWhere(collectionName, where) {
  const db = getDatabase();
  let deleted = 0;
  while (true) {
    const result = await db.collection(collectionName).where(where).limit(100).get();
    if (result.data.length === 0) return deleted;
    await Promise.all(result.data.map((document) => db.collection(collectionName).doc(document._id).remove()));
    deleted += result.data.length;
  }
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

module.exports = { authenticate, cleanupEvents, createInstallation, deleteInstallation, queryEvents, saveEvents };
