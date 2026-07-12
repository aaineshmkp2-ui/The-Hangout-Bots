const { AuditLogEvent } = require('discord.js');
const { recordAndCheck } = require('../handlers/antiNuke');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    const guild = ban.guild;
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
    recordAndCheck(guild, entry.executor.id).catch(() => {});
  },
};
