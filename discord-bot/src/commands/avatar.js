const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Show a member\'s full-size avatar')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { getAccentColor } = require('../handlers/brandingManager');
    const cfg = getGuildConfig(interaction.guild.id);

    const user = interaction.options.getUser('user') || interaction.user;
    const embed = new EmbedBuilder()
      .setColor(getAccentColor(cfg))
      .setTitle(`${user.username}'s avatar`)
      .setImage(user.displayAvatarURL({ size: 512 }));
    return interaction.reply({ embeds: [embed] });
  },
};
