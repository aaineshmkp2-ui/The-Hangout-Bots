const { db } = require('../database');

const timers = new Map(); // reminderId -> setTimeout handle

function parseDuration(str) {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(str.trim());
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[unit];
}

function scheduleReminder(client, id, delay) {
  const safeDelay = Math.min(delay, 2147000000);
  const timer = setTimeout(() => fireReminder(client, id), safeDelay);
  timers.set(id, timer);
}

async function fireReminder(client, id) {
  const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
  if (!row || row.sent) return;
  db.prepare('UPDATE reminders SET sent = 1 WHERE id = ?').run(id);

  const channel = await client.channels.fetch(row.channel_id).catch(() => null);
  if (channel) {
    channel.send(`⏰ <@${row.user_id}>, reminder: ${row.message}`).catch(() => {});
  }
  timers.delete(id);
}

function createReminder(client, { guildId, channelId, userId, message, durationStr }) {
  const ms = parseDuration(durationStr);
  if (!ms || ms < 5000) return null;

  const remindAt = Date.now() + ms;
  const info = db.prepare(
    'INSERT INTO reminders (guild_id, channel_id, user_id, message, remind_at, sent) VALUES (?, ?, ?, ?, ?, 0)'
  ).run(guildId, channelId, userId, message, remindAt);

  scheduleReminder(client, info.lastInsertRowid, ms);
  return remindAt;
}

function resumeReminders(client) {
  const pending = db.prepare('SELECT * FROM reminders WHERE sent = 0').all();
  for (const r of pending) {
    const remaining = r.remind_at - Date.now();
    if (remaining <= 0) fireReminder(client, r.id);
    else scheduleReminder(client, r.id, remaining);
  }
}

module.exports = { createReminder, resumeReminders, parseDuration };
