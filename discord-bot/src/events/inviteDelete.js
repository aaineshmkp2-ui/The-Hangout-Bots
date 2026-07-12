const { cacheGuildInvites } = require('../handlers/inviteTracker');

module.exports = {
  name: 'inviteDelete',
  async execute(invite) {
    if (invite.guild) await cacheGuildInvites(invite.guild);
  },
};
