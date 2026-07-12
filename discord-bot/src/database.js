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

CREATE TABLE IF NOT EXISTS user_levels (
  guild_id TEXT,
  user_id TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  last_xp_at INTEGER DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS invite_uses (
  guild_id TEXT,
  inviter_id TEXT,
  uses INTEGER DEFAULT 0,
  PRIMARY KEY (guild_id, inviter_id)
);

CREATE TABLE IF NOT EXISTS reaction_roles (
  guild_id TEXT,
  message_id TEXT,
  emoji TEXT,
  role_id TEXT,
  PRIMARY KEY (message_id, emoji)
);

CREATE TABLE IF NOT EXISTS blacklist_words (
  guild_id TEXT,
  word TEXT,
  PRIMARY KEY (guild_id, word)
);

CREATE TABLE IF NOT EXISTS afk_status (
  guild_id TEXT,
  user_id TEXT,
  reason TEXT,
  set_at INTEGER,
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  channel_id TEXT,
  user_id TEXT,
  message TEXT,
  remind_at INTEGER,
  sent INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS starboard_posts (
  guild_id TEXT,
  original_message_id TEXT UNIQUE,
  starboard_message_id TEXT,
  star_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  guild_id TEXT,
  name TEXT,
  content TEXT,
  created_by TEXT,
  PRIMARY KEY (guild_id, name)
);
`);

// Safe migrations for columns added after initial release.
// SQLite errors on duplicate ADD COLUMN, so each is wrapped individually.
const migrations = [
  "ALTER TABLE guild_config ADD COLUMN leveling_enabled INTEGER DEFAULT 0",
  "ALTER TABLE guild_config ADD COLUMN level_up_channel TEXT",
  "ALTER TABLE guild_config ADD COLUMN level_up_message TEXT",
  "ALTER TABLE guild_config ADD COLUMN invite_tracker_enabled INTEGER DEFAULT 0",
  "ALTER TABLE guild_config ADD COLUMN jail_role_id TEXT",
  "ALTER TABLE guild_config ADD COLUMN jail_channel_id TEXT",
  "ALTER TABLE guild_config ADD COLUMN blacklist_enabled INTEGER DEFAULT 0",
  "ALTER TABLE guild_config ADD COLUMN starboard_channel TEXT",
  "ALTER TABLE guild_config ADD COLUMN starboard_threshold INTEGER DEFAULT 3",
  "ALTER TABLE guild_config ADD COLUMN starboard_enabled INTEGER DEFAULT 0",
  "ALTER TABLE guild_config ADD COLUMN antinuke_enabled INTEGER DEFAULT 0",
];
for (const sql of migrations) {
  try { db.exec(sql); } catch (e) { /* column already exists, ignore */ }
}

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
