const { EmbedBuilder } = require('discord.js');

// executorId -> array of action timestamps (in-memory, resets on restart — fine for a burst detector)
const actionLog = new Map();
const WINDOW_MS = 10 * 1000; // 10 second window
const THRESHOLD = 3; // 3+ destructive actions in the window trips it

async function recordAndCheck(guild, executorId) {
  const { getGuildConfig } = require('../database');
  const cfg = getGuildConfig(guild.id);
  if (!cfg.antinuke_enabled) return;
  if (executorId === guild.ownerId) return; // never punish the owner

  const now = Date.now();
  const key = `${guild.id}:${executorId}`;
  const timestamps = (actionLog.get(key) || []).filter(t => now - t < WINDOW_MS);
  timestamps.push(now);
  actionLog.set(key, timestamps);

  if (timestamps.length < THRESHOLD) return;
  actionLog.set(key, []); // reset so we don't re-trigger every subsequent action

  const member = await guild.members.fetch(executorId).catch(() => null);
  if (!member) return;

  // Strip all roles as a quarantine measure — doesn't ban, since false positives are possible
  // (e.g. legitimate mass cleanup), and an admin can review and undo.
  const removableRoles = member.roles.cache.filter(r => r.id !== guild.id && !r.managed);
  await member.roles.remove(removableRoles).catch(() => {});

  if (cfg.mod_log_channel) {
    const logChannel = guild.channels.cache.get(cfg.mod_log_channel);
    logChannel?.send({
      embeds: [new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('🛡️ Anti-Nuke Triggered')
        .setDescription(`${member} performed ${timestamps.length}+ destructive actions in ${WINDOW_MS / 1000}s and had their roles stripped as a precaution.\n\nReview and manually restore roles if this was a false positive.`)
        .setTimestamp()],
    }).catch(() => {});
  }
}

module.exports = { recordAndCheck };
