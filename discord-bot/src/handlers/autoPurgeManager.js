const { db } = require('../database');

const timers = new Map(); // autoPurgeId -> setTimeout handle

function parseInterval(str) {
  const match = /^(\d+)\s*(m|h|d)$/i.exec(str.trim());
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[unit];
}

function scheduleNext(client, id, delay) {
  const safeDelay = Math.min(Math.max(delay, 1000), 2147000000);
  const timer = setTimeout(() => firePurge(client, id), safeDelay);
  timers.set(id, timer);
}

async function firePurge(client, id) {
  const row = db.prepare('SELECT * FROM auto_purge WHERE id = ?').get(id);
  if (!row || !row.enabled) { timers.delete(id); return; }

  const channel = await client.channels.fetch(row.channel_id).catch(() => null);
  if (channel) {
    const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (messages) await channel.bulkDelete(messages, true).catch(() => {});
  }

  const nextRun = Date.now() + row.interval_ms;
  db.prepare('UPDATE auto_purge SET next_run = ? WHERE id = ?').run(nextRun, id);
  scheduleNext(client, id, row.interval_ms);
}

function createAutoPurge(client, { guildId, channelId, intervalStr }) {
  const ms = parseInterval(intervalStr);
  if (!ms || ms < 60000) return null;

  const nextRun = Date.now() + ms;
  const info = db.prepare(
    'INSERT INTO auto_purge (guild_id, channel_id, interval_ms, next_run, enabled) VALUES (?, ?, ?, ?, 1)'
  ).run(guildId, channelId, ms, nextRun);

  scheduleNext(client, info.lastInsertRowid, ms);
  return info.lastInsertRowid;
}

function stopAutoPurge(id) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  db.prepare('UPDATE auto_purge SET enabled = 0 WHERE id = ?').run(id);
}

function resumeAutoPurges(client) {
  const active = db.prepare('SELECT * FROM auto_purge WHERE enabled = 1').all();
  for (const row of active) {
    const remaining = row.next_run - Date.now();
    scheduleNext(client, row.id, remaining > 0 ? remaining : row.interval_ms);
  }
}

module.exports = { createAutoPurge, stopAutoPurge, resumeAutoPurges, parseInterval };
