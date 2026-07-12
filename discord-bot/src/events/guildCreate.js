const { cacheGuildInvites } = require('../handlers/inviteTracker');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    await cacheGuildInvites(guild);
  },
};
