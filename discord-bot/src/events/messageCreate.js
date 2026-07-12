const { EmbedBuilder } = require('discord.js');
const { getGuildConfig, db } = require('../database');
const { addXp } = require('../handlers/levelingManager');

function fillPlaceholders(text, member, level) {
  return text
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{level}', level.toString());
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const cfg = getGuildConfig(message.guild.id);

    // Blacklisted word filter
    if (cfg.blacklist_enabled) {
      const words = db.prepare('SELECT word FROM blacklist_words WHERE guild_id = ?').all(message.guild.id).map(r => r.word);
      if (words.length > 0) {
        const content = message.content.toLowerCase();
        const hit = words.find(w => content.includes(w.toLowerCase()));
        if (hit) {
          await message.delete().catch(() => {});
          message.channel.send({ content: `${message.author}, that message contained a blocked word and was removed.` })
            .then(m => setTimeout(() => m.delete().catch(() => {}), 5000))
            .catch(() => {});
          return; // don't award XP for a deleted message
        }
      }
    }

    // Leveling
    if (cfg.leveling_enabled) {
      const result = addXp(message.guild.id, message.author.id);
      if (result?.leveledUp) {
        const text = cfg.level_up_message || '🎉 {user} just reached level **{level}**!';
        const targetChannel = cfg.level_up_channel
          ? message.guild.channels.cache.get(cfg.level_up_channel)
          : message.channel;
        if (targetChannel) {
          const embed = new EmbedBuilder()
            .setColor(0xe8a33d)
            .setDescription(fillPlaceholders(text, message.member, result.level));
          targetChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }
  },
};
