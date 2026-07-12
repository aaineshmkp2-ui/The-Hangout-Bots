const { db } = require('../database');
const { handleStarReaction } = require('../handlers/starboardManager');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    if (user.bot) return;
    try {
      if (reaction.partial) await reaction.fetch();
    } catch { return; }
    if (!reaction.message.guild) return;

    handleStarReaction(reaction).catch(() => {});

    const emojiKey = reaction.emoji.id || reaction.emoji.name;
    const row = db.prepare('SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?')
      .get(reaction.message.id, emojiKey);
    if (!row) return;

    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    member.roles.remove(row.role_id).catch(() => {});
  },
};
