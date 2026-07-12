module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('/panel | all-in-one bot');

    const { cacheAllGuilds } = require('../handlers/inviteTracker');
    await cacheAllGuilds(client);
  },
};
