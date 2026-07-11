const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'bot.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY,
  welcome_channel TEXT,
  welcome_message TEXT,
  welcome_enabled INTEGER DEFAULT 0,
  leave_channel TEXT,
  leave_message TEXT,
  leave_enabled INTEGER DEFAULT 0,
  ticket_category TEXT,
  ticket_log_channel TEXT,
  mod_log_channel TEXT,
  autorole_id TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  channel_id TEXT UNIQUE,
  user_id TEXT,
  status TEXT DEFAULT 'open',
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS giveaways (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  channel_id TEXT,
  message_id TEXT UNIQUE,
  prize TEXT,
  winners_count INTEGER,
  host_id TEXT,
  end_time INTEGER,
  ended INTEGER DEFAULT 0,
  entries TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS role_panels (
  guild_id TEXT,
  message_id TEXT,
  channel_id TEXT,
  role_id TEXT,
  emoji TEXT,
  label TEXT,
  PRIMARY KEY (message_id, role_id)
);

CREATE TABLE IF NOT EXISTS warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  user_id TEXT,
  moderator_id TEXT,
  reason TEXT,
  created_at INTEGER
);
`);

function getGuildConfig(guildId) {
  let row = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
  if (!row) {
    db.prepare('INSERT INTO guild_config (guild_id) VALUES (?)').run(guildId);
    row = db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
  }
  return row;
}

function updateGuildConfig(guildId, fields) {
  getGuildConfig(guildId); // ensure row exists
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => fields[k]);
  db.prepare(`UPDATE guild_config SET ${setClause} WHERE guild_id = ?`).run(...values, guildId);
}

module.exports = { db, getGuildConfig, updateGuildConfig };
