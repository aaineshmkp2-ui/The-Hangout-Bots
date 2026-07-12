const { AuditLogEvent } = require('discord.js');
const { recordAndCheck } = require('../handlers/antiNuke');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    if (!channel.guild) return;
    const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return; // stale/unrelated entry
    recordAndCheck(channel.guild, entry.executor.id).catch(() => {});
  },
};
