const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Show the last deleted message in this channel'),

  async execute(interaction) {
    const { snipeCache } = require('../events/messageDelete');
    const entry = snipeCache.get(interaction.channel.id);

    if (!entry) {
      return interaction.reply({ content: 'Nothing to snipe — no recent deletions here.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x8b93a7)
      .setAuthor({ name: entry.authorTag, iconURL: entry.authorAvatar || undefined })
      .setDescription(entry.content)
      .setFooter({ text: 'Deleted' })
      .setTimestamp(entry.deletedAt);

    return interaction.reply({ embeds: [embed] });
  },
};
