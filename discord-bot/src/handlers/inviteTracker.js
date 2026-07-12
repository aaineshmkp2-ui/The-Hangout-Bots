const { db } = require('../database');

// guildId -> Map(code -> uses), built from Discord's own invite list.
const inviteCache = new Map();

async function cacheGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    const map = new Map();
    invites.forEach(inv => map.set(inv.code, { uses: inv.uses || 0, inviterId: inv.inviter?.id || null }));
    inviteCache.set(guild.id, map);
  } catch (e) {
    // Missing Manage Server permission or other fetch failure — invite tracking just won't work for this guild.
  }
}

async function cacheAllGuilds(client) {
  for (const guild of client.guilds.cache.values()) {
    await cacheGuildInvites(guild);
  }
}

function recordUse(guildId, inviterId) {
  if (!inviterId) return;
  const row = db.prepare('SELECT * FROM invite_uses WHERE guild_id = ? AND inviter_id = ?').get(guildId, inviterId);
  if (row) {
    db.prepare('UPDATE invite_uses SET uses = uses + 1 WHERE guild_id = ? AND inviter_id = ?').run(guildId, inviterId);
  } else {
    db.prepare('INSERT INTO invite_uses (guild_id, inviter_id, uses) VALUES (?, ?, 1)').run(guildId, inviterId);
  }
}

// Call on guildMemberAdd: diffs the live invite list against our cache to find which code went up.
async function handleMemberJoin(member) {
  const { getGuildConfig } = require('../database');
  const cfg = getGuildConfig(member.guild.id);
  if (!cfg.invite_tracker_enabled) return null;

  const before = inviteCache.get(member.guild.id) || new Map();
  let usedInviterId = null;
  let usedCode = null;

  try {
    const after = await member.guild.invites.fetch();
    for (const inv of after.values()) {
      const prev = before.get(inv.code);
      const prevUses = prev?.uses || 0;
      if ((inv.uses || 0) > prevUses) {
        usedInviterId = inv.inviter?.id || null;
        usedCode = inv.code;
        break;
      }
    }
    const newMap = new Map();
    after.forEach(inv => newMap.set(inv.code, { uses: inv.uses || 0, inviterId: inv.inviter?.id || null }));
    inviteCache.set(member.guild.id, newMap);
  } catch (e) {
    return null;
  }

  if (usedInviterId) recordUse(member.guild.id, usedInviterId);
  return { inviterId: usedInviterId, code: usedCode };
}

function getInviteCount(guildId, userId) {
  const row = db.prepare('SELECT * FROM invite_uses WHERE guild_id = ? AND inviter_id = ?').get(guildId, userId);
  return row?.uses || 0;
}

function getInviteLeaderboard(guildId, limit = 10) {
  return db.prepare('SELECT * FROM invite_uses WHERE guild_id = ? ORDER BY uses DESC LIMIT ?').all(guildId, limit);
}

module.exports = { cacheGuildInvites, cacheAllGuilds, handleMemberJoin, getInviteCount, getInviteLeaderboard };
