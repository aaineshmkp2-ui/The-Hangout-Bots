const { AuditLogEvent } = require('discord.js');
const { recordAndCheck } = require('../handlers/antiNuke');

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    if (!role.guild) return;
    const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
    recordAndCheck(role.guild, entry.executor.id).catch(() => {});
  },
};
