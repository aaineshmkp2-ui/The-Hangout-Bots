const { db } = require('../database');

// Standard-ish curve: total XP needed to reach a given level.
function xpForLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

function levelFromXp(xp) {
  let level = 0;
  while (xp >= xpForLevel(level)) level++;
  return level;
}

const cooldowns = new Map(); // `${guildId}:${userId}` -> last XP timestamp
const COOLDOWN_MS = 60 * 1000;
const XP_MIN = 15;
const XP_MAX = 25;

function addXp(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const now = Date.now();
  const last = cooldowns.get(key) || 0;
  if (now - last < COOLDOWN_MS) return null; // still on cooldown, no XP this message

  cooldowns.set(key, now);

  const row = db.prepare('SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
  const gained = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
  const prevXp = row?.xp || 0;
  const prevLevel = row?.level ?? levelFromXp(prevXp);
  const newXp = prevXp + gained;
  const newLevel = levelFromXp(newXp);

  if (row) {
    db.prepare('UPDATE user_levels SET xp = ?, level = ?, last_xp_at = ? WHERE guild_id = ? AND user_id = ?')
      .run(newXp, newLevel, now, guildId, userId);
  } else {
    db.prepare('INSERT INTO user_levels (guild_id, user_id, xp, level, last_xp_at) VALUES (?, ?, ?, ?, ?)')
      .run(guildId, userId, newXp, newLevel, now);
  }

  return { xp: newXp, level: newLevel, leveledUp: newLevel > prevLevel };
}

function getRank(guildId, userId) {
  const row = db.prepare('SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
  if (!row) return { xp: 0, level: 0, rank: null };
  const rank = db.prepare('SELECT COUNT(*) + 1 as rank FROM user_levels WHERE guild_id = ? AND xp > ?')
    .get(guildId, row.xp).rank;
  return { xp: row.xp, level: row.level, rank };
}

function getLeaderboard(guildId, limit = 10) {
  return db.prepare('SELECT * FROM user_levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ?').all(guildId, limit);
}

module.exports = { addXp, getRank, getLeaderboard, xpForLevel, levelFromXp };
