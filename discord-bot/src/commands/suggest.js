const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Post a suggestion for the server')
    .addStringOption(o => o.setName('suggestion').setDescription('Your idea').setRequired(true)),

  async execute(interaction) {
    const suggestion = interaction.options.getString('suggestion');
    const embed = new EmbedBuilder()
      .setColor(0x45d6c0)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(suggestion)
      .setFooter({ text: 'Suggestion' })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('👍');
    await msg.react('👎');
  },
};
